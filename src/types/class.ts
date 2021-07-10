import OrbitDB from 'orbit-db';
import OrbitTools from '../utils/db'
import events from 'events'

class QmStore {
    database: any;
    store: any;
    address: string;
    static prefix: string;
    convertList: object;
    events = new events.EventEmitter()
    
    state: boolean = false
    constructor(database: any) {
        this.database = database;
        this.store = null
    }

    $N(path, value, val) {
        let pos
        while(true) {
            pos = path.indexOf('.')
            if (pos === -1) {
                val[path] = value
                break
            }
            if (val[path.substring(0, pos)] == undefined){
                val[path.substring(0, pos)] = {}
            }
            val = val[path.substring(0, pos)]
            path = path.substring(pos + 1, path.length)
        }
    }

    finish() {
        this.state = true
    }

    async convertor_kv(store = this.store, convertList = this.convertList, cb = () => this.finish()) {
        let endpt
        for (let key in convertList) {
            let val = await store.get(key)
            if (val == undefined) {
                return
            } else {
                let conv = convertList[key]
                if (conv.endsWith("?")) {
                    endpt = true
                    conv = conv.substring(0, conv.length - 1)
                }else{
                    endpt = false
                }
                this.$N(conv, val, this)
            }
        }
        if (endpt) {
            cb()
        }
    }

    async convertor_fe(store = this.store, fedlist = "list", cb = () => this.finish()) {
        let feeds = []
        let sign = false
        for await (let e of store.iterator({ limit: -1 })){
            let addr = e.payload.value;
            if(addr == "<start>") {
                sign = true
            }else{
                feeds.push(addr)
            }
        }
        if(sign) {
            this[fedlist] = feeds
            cb()
        }
    }
}

class QmIllustStore extends QmStore implements QmIllust {
    static prefix: string = "QmNetI";
    userAddr: string;
    pagesStore: any;
    address: string;

    id: string;
    createDate: string;
    uploadDate: string;

    title: string;
    description: string;
    image: QmIllust["image"];

    constructor(database: any, address: string, user = null) {
        super(database);
        this.address = address;
        this.userAddr = user
    }

    async openStore(){
        if(QmIllustStore.isValidAddress(this.address) && this.userAddr) {
            this.store = await this.database.keyvalue(this.address, {
                accessController: {
                    write: [
                        this.userAddr
                    ],
                    replicate: true
                }
            })
        }else if(OrbitDB.isValidAddress(this.address)) {
            this.store = await this.database.keyvalue(this.address)
        }else{
            return false;
        }
        this.store.events.on("replicated", this.loadInfo)
        await this.store.load()
        return true;
    }

    async load() {
        if(! await this.openStore()) return false;
        await this.loadInfo();
        await this.loadPages();
        return true;
    }

    async loadInfo() {
        this.id = this.store.address.path;
        this.createDate = await this.store.get("createDate")
        this.uploadDate = await this.store.get("uploadDate")

        this.title = await this.store.get("title")
        this.description = await this.store.get("description")

        this.image = {
            pages: []
        }

        let preview = await this.store.get("preview")
        if(preview) {
            this.image.preview = preview
        }
        this.pagesStore = await this.database.feed(this.store.address  + ".pages")
        this.pagesStore.events.on("replicated", this.loadPages)
        await this.pagesStore.load()
    }

    async loadPages() {
        this.image.pages = []
        for await (let e of this.pagesStore.iterator({ limit: -1 })) {
            let addr = e.payload.value;
            this.image.pages.push(addr)
        }
    }

    static isValidAddress(address) {
        if(address.startsWith(QmIllustStore.prefix) && address.length > QmIllustStore.prefix.length){
            return true;
        }
        return false;
    }
}

class QmUserStore extends QmStore implements QmUser {
    static prefix: string = "QmNetU";
    illustsStore: any;
    address: string;

    id: string;
    createDate: string;
    uploadDate: string;
    profile: {
        name: string;
        avatar: string;
        bio: string;
        background?: string;
        tags?: string[];
    };
    illustsStoreID: QmDBId;
    illusts: QmIllustId[];

    illustsState: boolean = false

    convertList = {
        "createDate": "createDate",
        "uploadDate": "uploadDate",
        "name": "profile.name",
        "avatar": "profile.avatar",
        "bio": "profile.bio",
        "background": "profile.background",
        "tags": "profile.tags",
        "illusts": "illustsStoreID?"
    }

    constructor(database: any, address: string) {
        super(database);
        this.address = address;
    }

    async openStore() {
        if(QmUserStore.isValidAddress(this.address)) {
            this.store = await this.database.keyvalue(this.address, {
                accessController: {
                    write: [
                        this.address.substr(QmUserStore.prefix.length, this.address.length)
                    ],
                    replicate: true
                }
            })
        }else{
            return false;
        }
        this.store.events.on("replicated", () => {
            this.loadProfile()
        })
        await this.store.load()
        this.loadProfile()
        return true;
    }

    async load() {
        if(!await this.openStore()) return false;
        return true;
    }

    async loadProfile() {
        this.id = this.store.address.path;
        this.convertor_kv(this.store, this.convertList, () => this.profileFinish())
    }

    async profileFinish() {
        await this.loadIllustsStore()
        this.state = true
        this.events.emit("profile_loaded")
    }

    async loadIllustsStore() {
        this.illustsStore = await this.database.feed(this.illustsStoreID)
        this.illustsStore.events.on("replicated", () => {
            this.loadIllusts()
        })
        await this.illustsStore.load()
        this.loadIllusts()
    }

    async loadIllusts() {
        await this.convertor_fe(this.illustsStore, "illusts", () => this.illustsFinish())
    }

    async illustsFinish() {
        this.illustsState = true
        this.events.emit("illusts_loaded")
    }

    static isValidAddress(address) {
        if(address.startsWith(QmUserStore.prefix) && address.length > QmUserStore.prefix.length){
            return true;
        }
        return false;
    }
}

export default {
    QmUserStore,
    QmIllustStore
}