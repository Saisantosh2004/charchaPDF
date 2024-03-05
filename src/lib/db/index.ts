import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle  } from "drizzle-orm/neon-http";
import { NeonQueryFunction } from "@neondatabase/serverless";
import  dotenv from "dotenv";

dotenv.config({ path: "../../../.env" });

neonConfig.fetchConnectionCache = true;

if (!process.env.DATABASE_URL) {
    console.log("database_url "+ process.env.DATABASE_URL)
    throw new Error("database url not found");
}

const sql = neon(process.env.DATABASE_URL!) as NeonQueryFunction<boolean,boolean>;

export const db = drizzle(sql);

// import { drizzle } from "drizzle-orm/postgres-js";
// import postgres from "postgres";
// import * as dotenv from 'dotenv';
// import * as schema from "./schema"
// import { migrate } from "drizzle-orm/postgres-js/migrator";

// dotenv.config({path:'../../../.env'});

// if(!process.env.DATABASE_URL){
//     console.log("No DB URL")
// }

// const client = postgres(process.env.DATABASE_URL as string , {max:1});
// export const db = drizzle(client,{schema});
// const migrateDb = async ()=>{
//     try{
//         console.log("Migrating client");
//         await migrate(db,{migrationsFolder:"migrations"});
//         console.log("Succesfully Migrated");
//     }   
//     catch(error){
//         console.log("Error in Migrating")
//     }
// }
// migrateDb();

// import { drizzle } from 'drizzle-orm/postgres-js'
// import postgres from 'postgres'
// import * as schema from "./schema"

// const connectionString = process.env.DATABASE_URL!

// // Disable prefetch as it is not supported for "Transaction" pool mode
// const client = postgres(connectionString, { prepare: false })
// export const db = drizzle(client,{schema});

