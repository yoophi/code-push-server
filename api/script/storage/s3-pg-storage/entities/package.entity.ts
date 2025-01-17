import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from "typeorm";
import { DeploymentToPackage } from '.';

@Entity('packages')
export class Package {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'app_version' })
    appVersion!: string;

    @Column({ name: 'blob_url' })
    blobUrl!: string;

    @Column({ nullable: true })
    description!: string;

    @Column({ name: 'is_disabled', default: false })
    isDisabled!: boolean;

    @Column({ name: 'is_mandatory', default: false })
    isMandatory!: boolean;

    @Column({ name: 'manifest_blob_url' })
    manifestBlobUrl!: string;

    @Column({ name: 'package_hash' })
    packageHash!: string;

    @Column({ nullable: true })
    rollout!: number | null;

    @Column()
    size!: number;

    @CreateDateColumn({ name: 'upload_time' })
    uploadTime!: Date;

    @Column({ name: 'release_method' })
    releaseMethod!: string;

    // @Column({ name: 'original_label', nullable: true, type: 'varchar' })
    // originalLabel!: string | null;

    // @Column({ name: 'original_deployment', nullable: true, type: 'varchar' })
    // originalDeployment!: string | null;

    @OneToMany(() => DeploymentToPackage, (deploymentToPackage) => deploymentToPackage.package)
    deploymentToPackages!: DeploymentToPackage[];
} 