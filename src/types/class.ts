import OrbitDB from 'orbit-db';
import OrbitTools from '../utils/db'

class QmStore {
    database: any;
    store: any;
    address: string;
    static prefix: string;
    constructor(database: any) {
        this.database = database;
        this.store = null
    }

    structConvertor(store) {
        
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
    illusts: QmIllust[];

    convertList = {
        "id": "store.address.path",
        "createDate": "createDate",
        "uploadDate": "uploadDate",
        "name": "profile.name",
        "avatar": "profile.avatar",
        "bio": "profile.bio",
        "background?": "profile.background",
        "tags": "profile.tags",
        "illusts": "return"
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
        //this.store.events.on("replicated", () => {
        //    this.loadProfile()
        //})
        //await this.store.load();
        return true;
    }
    async load() {
        if(!await this.openStore()) return false;
        return true;
    }

    async loadProfile() {
        
        this.id = this.store.address.path;
        this.createDate = await this.store.get("createDate")
        this.uploadDate = await this.store.get("uploadDate")

        this.profile = {
            name: await this.store.get("name"),
            avatar: await this.store.get("avatar"),
            bio: await this.store.get("bio")
        }
        
        let background = await this.store.get("background")
        if(background && background != "") {
            this.profile.background = background
        }
        let tags = await this.store.get("tags")
        this.profile.tags = tags
        let illustsAddr = await this.store.get("illusts")
        let illustsOptions = undefined
        if(!illustsAddr || illustsAddr == ""){
            illustsAddr = this.store.address.path + ".illusts",
            illustsOptions = {
                accessController: {
                    write: [
                        this.address.substr(QmUserStore.prefix.length, this.address.length)
                    ],
                    replicate: true
                }
            }
        }
        this.illustsStore = await this.database.feed(illustsAddr, illustsOptions)
        await this.illustsStore.load();
        this.illustsStore.events.on("replicated", () => {
            this.loadIllusts()
        })
    }

    async loadIllusts() {
        let illustsAddrCache = []
        let sign = false
        for await (let e of this.illustsStore.iterator({ limit: -1 })){
            let addr = e.payload.value;
            if(addr == "<start>") {
                sign = true
            }else{
                illustsAddrCache.push(addr)
            }
        }
        if(sign) {
            for(let addr of illustsAddrCache) {
                let newStore = new QmIllustStore(this.database, addr)
                newStore.load()
                this.illusts.push(newStore)
            }
        }

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