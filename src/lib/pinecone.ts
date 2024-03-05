import {RecursiveCharacterTextSplitter,Document} from "@pinecone-database/doc-splitter";
import { Pinecone, PineconeRecord} from "@pinecone-database/pinecone";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { downloadFromS3 } from "./s3server";
import { getEmbeddings } from "./embeddings";
import { convertToAscii } from "./utils";
import md5 from "md5"

let pinecone: Pinecone | null = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
});

export const getPineconeClient = async () => {
    if (!pinecone) {
        pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    }
    return pinecone;
};

type PDFPage = {
    pageContent: string;
    metadata: {
        loc: { pageNumber: number };
    };
};

export async function loadS3IntoPinecone(fileKey: string) {
    // 1. obtain the pdf
    // console.log("downloading from s3");
    const file_name = await downloadFromS3(fileKey);

    const loader = new PDFLoader(file_name);
    const pages = (await loader.load()) as PDFPage[];

    // 2. split and segment the pages
    const documents = await Promise.all(pages.map(prepareDocument));

    //3. vectorize and embed the individual documents/segments
    const vectors = await Promise.all(documents.flat().map(embedDocument));

    //4. upload in pinecone db
    const client = await getPineconeClient();
    const pineconeIndex = await client.index("charchapdf");
    const namespace = pineconeIndex.namespace(convertToAscii(fileKey));

    // console.log("inserting vectors into pinecone");
    await namespace.upsert(vectors);

    return documents[0];
}

export const truncateStringByBytes = (str: string, bytes: number) => {
    const enc = new TextEncoder();
    return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};

async function prepareDocument(page: PDFPage) {
    let { pageContent, metadata } = page;
    pageContent = pageContent.replace(/\n/g, "");
    // split the docs
    const splitter = new RecursiveCharacterTextSplitter();
    const docs = await splitter.splitDocuments([
        new Document({
            pageContent,
            metadata: {
                pageNumber: metadata.loc.pageNumber,
                text: truncateStringByBytes(pageContent, 36000),
            },
        }),
    ]);
    return docs;
}

async function embedDocument(doc: Document){
    try {
        const embeddings = await getEmbeddings(doc.pageContent);
        const hash = md5(doc.pageContent);

        return {
            id: hash,
            values: embeddings,
            metadata: {
                text: doc.metadata.text,
                pageNumber: doc.metadata.pageNumber,
            },
        } as PineconeRecord;

    } catch (error) {
        console.log("error embedding document", error);
        throw error;
    }
}