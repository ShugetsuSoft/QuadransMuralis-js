type QmId = string;
type QmIllustId = QmId;
type QmUserId = QmId;
type FileId = string;
type tag = string;

interface QmBase {
    id: QmId;
    createDate: string;
    uploadDate: string;
}

interface QmIllust extends QmBase {
    id: QmIllustId;

    title: string;
    description: string;
    tags?: tag[];

    image: {
        preview?: FileId;
        pages: FileId[];
    }

    user?: QmUser | QmUserId;
}

interface QmUser extends QmBase {
    id: QmUserId;

    profile: {
        name: string;
        avatar: FileId;
        bio: string;
        background?: FileId;
        tags?: tag[];
    };

    illusts?: QmIllust[];
}