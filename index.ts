import { Prisma, PrismaClient } from '@prisma/client'
import express from 'express'
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { MongoClient } from "mongodb";

const HF_TOKEN: string =    ""
const MONGODB_URI: string = "" 

const embeddingsModelPhayathai = new HuggingFaceInferenceEmbeddings({
  apiKey: HF_TOKEN, 
  model: "kornwtp/ConGen-model-phayathaibert",
});

    
const client = new MongoClient(MONGODB_URI);


const app = express()
// app.use(cors());
app.use(express.json())
async function resultsPhayathai(query: string) {
    const queryVectorPhayathai = await embeddingsModelPhayathai.embedQuery(query);
    try {
        await client.connect();
        const database = client.db("mobil_bootcathon");
        const collection = database.collection("rag_data");
        const resultsPhayathai = collection.aggregate([
            {"$vectorSearch": {
              "queryVector": queryVectorPhayathai,
              "path": "phayathai_embedding",
              "numCandidates": 100,
              "limit": 5,
              "index": "phayathai_vector_index",
                }}
          ])
        const recordsArr = await resultsPhayathai.toArray()
        let docs: string[] = [];
        recordsArr.forEach(function (value) {
            docs.push(value["text"]);
        });
        // console.log(docs.length)
        // console.log(docs[0])
        return docs
    } finally {
        await client.close();
    }
}

app.get('/query/:string', async (req, res) => {
    try {
        const { string } = req.params;
        const ans: any = await resultsPhayathai(string); 
        res.json(ans);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});