import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import * as q from 'q';
import { Readable } from 'stream';
import * as storage from "../storage";
import { AppDataSource } from './data-source';
import { AccessKey, Account, App, Blob, Deployment, DeploymentToPackage, Package } from './entities';

export class S3PGStorage implements storage.Storage {
  private s3Client: S3Client;

  constructor() {
    AppDataSource.initialize();
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
  }

  checkHealth(): q.Promise<void> {
    console.log("checkHealth");
    throw new Error('Method not implemented.');
  }
  addAccount(account: storage.Account): q.Promise<string> {
    console.log("addAccount", account);
    return q.Promise(async (resolve, reject) => {
      try {
        const accountData = {
          email: account.email,
          name: account.name,
          githubId: account.gitHubId,
          createdTime: new Date(account.createdTime)
        };
        
        const result = await AppDataSource.getRepository(Account).save(accountData);
        resolve(result.id.toString());
      } catch (err) {
        reject(storage.storageError(storage.ErrorCode.Other, err));
      }
    });
  }
  getAccount(accountId: string): q.Promise<storage.Account> {
    console.log("getAccount", accountId);
    return q.Promise<storage.Account>(async (resolve, reject) => {
      const accountEntity = await AppDataSource.getRepository(Account).findOne({ where: { id: parseInt(accountId) } });
      if (!accountEntity) {
        reject(storage.storageError(storage.ErrorCode.NotFound, "The specified account doesn't exist"));
        return
      }
      const storageAccount: storage.Account = {
        id: accountEntity.id.toString(),
        email: accountEntity.email,
        name: accountEntity.name,
        createdTime: accountEntity.createdTime.getTime(),
        azureAdId: null,
        gitHubId: accountEntity.githubId,
        microsoftId: null
      };
      resolve(storageAccount);
    });
  }
  getAccountByEmail(email: string): q.Promise<storage.Account> {
    console.log("getAccountByEmail", email);
    return q.Promise<storage.Account>(async (resolve, reject) => {
      const account = await AppDataSource.getRepository(Account).findOne({ where: { email } });
      if (!account) {
        reject(storage.storageError(
          storage.ErrorCode.NotFound,
          "The specified e-mail address doesn't represent a registered user"
        ));
        return
      }

      const storeageAccount: storage.Account = {
        id: account.id.toString(),
        email: account.email,
        name: account.name,
        createdTime: account.createdTime.getTime(),
        azureAdId: null,
        gitHubId: account.githubId,
        microsoftId: null
      };
      resolve(storeageAccount);
    })
  }
  getAccountIdFromAccessKey(accessKey: string): q.Promise<string> {
    console.log("getAccountIdFromAccessKey", accessKey);
    return q.Promise<string>(async (resolve, reject) => {
      const accessKeyEntity = await AppDataSource.getRepository(AccessKey).findOne({ where: { name: accessKey } });
      if (!accessKeyEntity) {
        reject(storage.storageError(storage.ErrorCode.NotFound, "The specified access key doesn't represent a registered user"));
        return
      }
      resolve(accessKeyEntity.accountId.toString());
    });
  }
  updateAccount(email: string, updates: storage.Account): q.Promise<void> {
    console.log("updateAccount", email, updates);
    throw new Error('Method not implemented.');
  }
  addApp(accountId: string, app: storage.App): q.Promise<storage.App> {
    console.log("addApp", accountId, app);
    return q.Promise<storage.App>(async (resolve, reject) => {
      const appData = {
        name: app.name,
        ownerAccountId: parseInt(accountId)
      };
      const appEntity = await AppDataSource.getRepository(App).save(appData);
      const storageApp : storage.App = {
        id: appEntity.id.toString(),
        name: appEntity.name,
        createdTime: appEntity.createdTime.getTime(),
        // accountId: result.ownerAccountId.toString(),
        collaborators: {},
      };
      resolve(storageApp);
    });
  }
  getApps(accountId: string): q.Promise<storage.App[]> {
    console.log("getApps", accountId);
    return q.Promise<storage.App[]>(async (resolve, reject) => {
      const apps = await AppDataSource.getRepository(App).find({ 
        where: { ownerAccountId: parseInt(accountId) },
        relations: ['owner', 'collaborators']
      });
      console.log('apps', apps)
      const storageApps: storage.App[] = apps.map((app) => {
        console.log('app.owner', app.owner)
        const collaboratorsMap : storage.CollaboratorMap = {
          [app.owner.email]: {
            permission: storage.Permissions.Owner,
            accountId: app.owner.id.toString(),
            isCurrentAccount: true
          }
        }
        app.collaborators.forEach((collaborator) => {
          collaboratorsMap[collaborator.email] = {
            permission: storage.Permissions.Collaborator,
            accountId: collaborator.id.toString(),
            isCurrentAccount: collaborator.id === parseInt(accountId)
          }
        });

        return {
          id: app.id.toString(),
          name: app.name,
          createdTime: app.createdTime.getTime(),
          accountId: app.ownerAccountId.toString(),
          collaborators: collaboratorsMap,
        }
      });
      resolve(storageApps);
    });
  }
  getApp(accountId: string, appId: string): q.Promise<storage.App> {
    console.log("getApp", accountId, appId);
    return q.Promise<storage.App>(async (resolve, reject) => {
      const appEntity = await AppDataSource.getRepository(App).findOne({ where: { id: parseInt(appId) } });
      if (!appEntity) {
        reject(storage.storageError(storage.ErrorCode.NotFound, "The specified app doesn't exist"));
        return
      }
      const storeaApp : storage.App = {
        id: appEntity.id.toString(),
        name: appEntity.name,
        createdTime: appEntity.createdTime.getTime(),
        collaborators: {},
      };
      resolve(storeaApp);
    });
  }
  removeApp(accountId: string, appId: string): q.Promise<void> {
    console.log("removeApp", accountId, appId);
    return q.Promise<void>(async (resolve, reject) => {
      await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
        await transactionalEntityManager.getRepository(Deployment).delete({ appId: parseInt(appId) });
        await transactionalEntityManager.createQueryBuilder()
          .delete()
          .from('collaborators')
          .where("app_id = :appId", { appId: parseInt(appId) })
          .execute();
        await transactionalEntityManager.getRepository(App).delete({ id: parseInt(appId), ownerAccountId: parseInt(accountId) });
      });
      resolve();
    });
  }
  transferApp(accountId: string, appId: string, email: string): q.Promise<void> {
    console.log("transferApp", accountId, appId, email);
    throw new Error('Method not implemented.');
  }
  updateApp(accountId: string, app: storage.App): q.Promise<void> {
    console.log("updateApp", accountId, app);
    return q.Promise<void>(async (resolve, reject) => {
      await AppDataSource.getRepository(App).update({ id: parseInt(appId) }, { name: app.name });
      resolve();
    });
  }
  addCollaborator(accountId: string, appId: string, email: string): q.Promise<void> {
    console.log("addCollaborator", accountId, appId, email);
    throw new Error('Method not implemented.');
  }
  getCollaborators(accountId: string, appId: string): q.Promise<storage.CollaboratorMap> {
    console.log("getCollaborators", accountId, appId);
    throw new Error('Method not implemented.');
  }
  removeCollaborator(accountId: string, appId: string, email: string): q.Promise<void> {
    console.log("removeCollaborator", accountId, appId, email);
    throw new Error('Method not implemented.');
  }
  addDeployment(accountId: string, appId: string, deployment: storage.Deployment): q.Promise<string> {
    console.log("addDeployment", accountId, appId, deployment);
    return q.Promise<string>(async (resolve, reject) => {
      const deploymentData = {
        name: deployment.name,
        appId: parseInt(appId),
        key: deployment.key
      };
      const deploymentEntity = await AppDataSource.getRepository(Deployment).save(deploymentData);
      resolve(deploymentEntity.id.toString());
    });
  }
  getDeployment(accountId: string, appId: string, deploymentId: string): q.Promise<storage.Deployment> {
    console.log("getDeployment", accountId, appId, deploymentId);
    return q.Promise<storage.Deployment>(async (resolve, reject) => {
      const deploymentEntity = await AppDataSource.getRepository(Deployment).findOne({ where: { id: parseInt(deploymentId) } });
      if (!deploymentEntity) {
        reject(storage.storageError(storage.ErrorCode.NotFound, "The specified deployment doesn't exist"));
        return
      }
      const storageDeployment: storage.Deployment = {
        id: deploymentEntity.id.toString(),
        name: deploymentEntity.name,
        createdTime: deploymentEntity.createdTime.getTime(),
        key: deploymentEntity.key,
        package: null
      };
      resolve(storageDeployment);
    });
  }
  getDeploymentInfo(deploymentKey: string): q.Promise<storage.DeploymentInfo> {
    console.log("getDeploymentInfo", deploymentKey);
    throw new Error('Method not implemented.');
  }
  getDeployments(accountId: string, appId: string): Promise<storage.Deployment[]> {
    console.log("getDeployments", accountId, appId);
    return AppDataSource.getRepository(Deployment)
      .find({ where: { appId: parseInt(appId) } })
      .then(async (deploymentEntities) => {
        const storageDeployments: storage.Deployment[] = await Promise.all(
          deploymentEntities.map(async (deployment) => {
            const latestPackageHistory = await AppDataSource.getRepository(DeploymentToPackage).findOne({
              where: { deploymentId: deployment.id },
              order: { id: "DESC" },
              relations: ["package"],
            });
            const currentPackage: storage.Package | null = latestPackageHistory
              ? {
                  appVersion: latestPackageHistory.package.appVersion,
                  blobUrl: latestPackageHistory.package.blobUrl,
                  description: latestPackageHistory.package.description,
                  isDisabled: latestPackageHistory.package.isDisabled,
                  isMandatory: latestPackageHistory.package.isMandatory,
                  manifestBlobUrl: latestPackageHistory.package.manifestBlobUrl,
                  packageHash: latestPackageHistory.package.packageHash,
                  rollout: latestPackageHistory.package.rollout,
                  size: latestPackageHistory.package.size,
                  uploadTime: latestPackageHistory.package.uploadTime.getTime(),
                  releaseMethod: latestPackageHistory.package.releaseMethod,
                  label: latestPackageHistory.label,
                  originalLabel: latestPackageHistory.originalLabel,
                }
              : null;
            return {
              id: deployment.id.toString(),
              name: deployment.name,
              createdTime: deployment.createdTime.getTime(),
              key: deployment.key,
              package: currentPackage as storage.Package,
            };
          })
        );
        return storageDeployments;
      })
      .then((storageDeployments) => {
        console.log("storageDeployments", storageDeployments);
        return storageDeployments;
      });
  }

  removeDeployment(accountId: string, appId: string, deploymentId: string): q.Promise<void> {
    console.log("removeDeployment", accountId, appId, deploymentId);
    return q.Promise<void>(async (resolve, reject) => {
      await AppDataSource.getRepository(Deployment).delete({ id: parseInt(deploymentId), appId: parseInt(appId) });
      resolve();
    });
  }
  updateDeployment(accountId: string, appId: string, deployment: storage.Deployment): q.Promise<void> {
    console.log("updateDeployment", accountId, appId, deployment);
    return q.Promise<void>(async (resolve, reject) => {
      await AppDataSource.getRepository(Deployment).update({ id: parseInt(deployment.id), appId: parseInt(appId) }, { name: deployment.name });
      resolve();
    });
  }
  commitPackage(accountId: string, appId: string, deploymentId: string, appPackage: storage.Package): q.Promise<storage.Package> {
    console.log("commitPackage", accountId, appId, deploymentId, appPackage);
    return q.Promise<storage.Package>(async (resolve, reject) => {
      const packageEntity = await AppDataSource.getRepository(Package).save({
        ...appPackage,
        uploadTime: new Date(),
      });
      const count = await AppDataSource.getRepository(DeploymentToPackage).count({
        where: { deploymentId: parseInt(deploymentId) },
      });
      await AppDataSource.getRepository(DeploymentToPackage).save({
        deploymentId: parseInt(deploymentId),
        packageId: packageEntity.id,
        label: `v${count + 1}`,
      });
      const storagePackage: storage.Package = {
        ...packageEntity,
        uploadTime: packageEntity.uploadTime.getTime(),
      };
      resolve(storagePackage);
    });
  }
  clearPackageHistory(accountId: string, appId: string, deploymentId: string): q.Promise<void> {
    console.log("clearPackageHistory", accountId, appId, deploymentId);
    throw new Error('Method not implemented.');
  }
  getPackageHistoryFromDeploymentKey(deploymentKey: string): q.Promise<storage.Package[]> {
    console.log("getPackageHistoryFromDeploymentKey", deploymentKey);
    throw new Error('Method not implemented.');
  }
  getPackageHistory(accountId: string, appId: string, deploymentId: string): q.Promise<storage.Package[]> {
    console.log("getPackageHistory", accountId, appId, deploymentId);
    return q.Promise<storage.Package[]>(async (resolve, reject) => {
      const packageEntities = await AppDataSource.getRepository(DeploymentToPackage).find({ 
        where: { deploymentId: parseInt(deploymentId) },
        relations: ['package']
       } );
      const storagePackages: storage.Package[] = packageEntities.map((packageEntity) => {
        return {
          id: packageEntity.package.id.toString(),
          appVersion: packageEntity.package.appVersion,
          blobUrl: packageEntity.package.blobUrl,
          description: packageEntity.package.description,
          isDisabled: packageEntity.package.isDisabled,
          isMandatory: packageEntity.package.isMandatory,
          manifestBlobUrl: packageEntity.package.manifestBlobUrl,
          packageHash: packageEntity.package.packageHash,
          rollout: packageEntity.package.rollout,
          size: packageEntity.package.size,
          uploadTime: packageEntity.package.uploadTime.getTime(),
          releaseMethod: packageEntity.package.releaseMethod,
          label: packageEntity.label,
          originalLabel: packageEntity.originalLabel
        }
      });
      resolve(storagePackages);
    });
  }
  updatePackageHistory(accountId: string, appId: string, deploymentId: string, history: storage.Package[]): q.Promise<void> {
    console.log("updatePackageHistory", accountId, appId, deploymentId, history);
    throw new Error('Method not implemented.');
  }
  addBlob(blobId: string, stream: Readable, streamLength: number): q.Promise<string> {
    console.log("addBlob", blobId, streamLength);
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: blobId,
      Body: stream,
      ContentLength: streamLength
    };

    return q.Promise<string>(async (resolve, reject) => {
      this.s3Client
      .send(new PutObjectCommand(params))
      .then(() => {
        resolve(blobId);
      }).catch(reject);
    })
    .then(
      async ()=> {
        const blobUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${blobId}`;
        await AppDataSource.getRepository(Blob).save({ blobId, blobUrl });
        return blobId;
      }
    );

  }
  getBlobUrl(blobId: string): q.Promise<string> {
    console.log("getBlobUrl", blobId);
    return q.Promise<string>(async (resolve, reject) => {
      const blobEntity = await AppDataSource.getRepository(Blob).findOne({ where: { blobId } });
      if (!blobEntity) {
        reject(storage.storageError(storage.ErrorCode.NotFound, "The specified blob doesn't exist"));
        return
      }
      resolve(blobEntity.blobUrl);
    });
  }
  removeBlob(blobId: string): q.Promise<void> {
    console.log("removeBlob", blobId);
    throw new Error('Method not implemented.');
  }
  addAccessKey(accountId: string, accessKey: storage.AccessKey): q.Promise<string> {
    console.log("addAccessKey", accountId, accessKey);
    return q.Promise<string>(async (resolve, reject) => {
      try {
        const accessKeyData = {
          accountId: parseInt(accountId),
          name: accessKey.name,
          friendlyName: accessKey.friendlyName,
          description: accessKey.description,
          createdBy: accessKey.createdBy,
          createdTime: new Date(accessKey.createdTime),
          expires: new Date(accessKey.expires),
          isSession: accessKey.isSession
        };
        const result = await AppDataSource.getRepository(AccessKey).save(accessKeyData);
        resolve(result.id.toString());
      } catch (err) {
        reject(storage.storageError(storage.ErrorCode.Other, err));
      }
    });
  }
  getAccessKey(accountId: string, accessKeyId: string): q.Promise<storage.AccessKey> {
    console.log("getAccessKey", accountId, accessKeyId);
    return q.Promise<storage.AccessKey>(async (resolve, reject) => {
      const accessKeyEntity = await AppDataSource.getRepository(AccessKey).findOne({ where: { id: parseInt(accessKeyId) } });
      if (!accessKeyEntity) {
        reject(storage.storageError(storage.ErrorCode.NotFound, "The specified access key doesn't exist"));
        return
      }
      const storageAccessKey : storage.AccessKey = {
        name: accessKeyEntity.name,
        createdTime: accessKeyEntity.createdTime.getTime(),
        createdBy: accessKeyEntity.createdBy,
        description: accessKeyEntity.description,
        expires: accessKeyEntity.expires.getTime(),
        friendlyName: accessKeyEntity.friendlyName,
        isSession: accessKeyEntity.isSession
      }
      resolve(storageAccessKey);
    });
  }
  getAccessKeys(accountId: string): q.Promise<storage.AccessKey[]> {
    console.log("getAccessKeys", accountId);
    return q.Promise<storage.AccessKey[]>(async (resolve, reject) => {
      const accessKeyEntities = await AppDataSource.getRepository(AccessKey).find({ where: { accountId: parseInt(accountId) } });
      const storageAccessKeys: storage.AccessKey[] = accessKeyEntities.map((accessKeyEntity) => {
        return {
          name: accessKeyEntity.name,
          createdTime: accessKeyEntity.createdTime.getTime(),
          createdBy: accessKeyEntity.createdBy,
          description: accessKeyEntity.description,
          expires: accessKeyEntity.expires.getTime(),
          friendlyName: accessKeyEntity.friendlyName,
          isSession: accessKeyEntity.isSession
        }
      });
      console.log('storageAccessKeys', storageAccessKeys)
      resolve(storageAccessKeys);
    });
  }
  removeAccessKey(accountId: string, accessKeyId: string): q.Promise<void> {
    console.log("removeAccessKey", accountId, accessKeyId);
    return q.Promise<void>(async (resolve, reject) => {
      await AppDataSource.getRepository(AccessKey).delete({ id: parseInt(accessKeyId), accountId: parseInt(accountId) });
      resolve();
    });
  }
  updateAccessKey(accountId: string, accessKey: storage.AccessKey): q.Promise<void> {
    console.log("updateAccessKey", accountId, accessKey);
    throw new Error('Method not implemented.');
  }
  dropAll(): q.Promise<void> {
    console.log("dropAll");
    throw new Error('Method not implemented.');
  }

} 