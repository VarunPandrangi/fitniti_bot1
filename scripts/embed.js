// scripts/embed.js
import fs from 'fs';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

// 1) Initialize a client to connect to your local Ollama server
const ollama = new OpenAI({
    baseURL: process.env.OLLAMA_HOST + '/v1',
    apiKey: 'ollama', // required for the SDK, but not used by Ollama
});

// 2) Load your source content
const KNOW = JSON.parse(fs.readFileSync('knowledge.json', 'utf-8'));
const OUT = [];

/**
 * Generates embeddings for all documents using a local Ollama model.
 * This version is more robust and will stop if errors occur.
 */
async function embedAll() {
    console.log(`Starting embedding process for ${KNOW.length} documents...`);
    console.log("This may take a few minutes.");

    for (const [index, doc] of KNOW.entries()) {
        try {
            // Log progress
            console.log(`Embedding document ${index + 1} of ${KNOW.length}: ${doc.url}`);
            
            const resp = await ollama.embeddings.create({
                model: 'nomic-embed-text',
                input: doc.text,
            });

            const embedding = resp.data[0].embedding;

            // Simple validation to ensure we got a real embedding
            if (!Array.isArray(embedding) || embedding.length === 0) {
                throw new Error("Received an invalid or empty embedding from Ollama.");
            }

            OUT.push({ url: doc.url, text: doc.text, embedding });

        } catch (err) {
            console.error(`\n--- FATAL ERROR ---`);
            console.error(`Error embedding document: ${doc.url}`);
            console.error(`Message: ${err.message}`);
            console.error("\nPlease ensure the Ollama application is running and the 'nomic-embed-text' model is installed ('ollama pull nomic-embed-text').");
            console.error("Aborting script. No file will be written.");
            // Exit the script immediately on failure
            process.exit(1); 
        }
    }

    // 3) Save the embeddings to a new file ONLY if all documents were processed
    if (OUT.length === KNOW.length) {
        fs.writeFileSync('embeddings.json', JSON.stringify(OUT, null, 2));
        console.log(`\n🎉 Success! embeddings.json created with ${OUT.length} items.`);
    } else {
        console.log(`\n⚠️ Embedding process did not complete. embeddings.json was NOT created. Please check the errors above.`);
    }
}

embedAll();
