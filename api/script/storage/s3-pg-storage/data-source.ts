import "reflect-metadata";
import { DataSource } from "typeorm";
import { Account, AccessKey, App, Blob, Deployment, DeploymentToPackage, Package } from "./entities";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT),
  username: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  synchronize: true,
  logging: false,
  entities: [Account, AccessKey, App, Blob, Deployment, Package, DeploymentToPackage],
  migrations: [],
  subscribers: [],
});
