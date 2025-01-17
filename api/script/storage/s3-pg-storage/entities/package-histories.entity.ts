import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Deployment, Package } from ".";

@Entity('deployment_package_histories')
export class DeploymentToPackage {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'deployment_id' })
    deploymentId!: number;

    @Column({ name: 'package_id' })
    packageId!: number;

    @ManyToOne(() => Deployment, (deployment) => deployment.packageToDeployments)
    @JoinColumn({ name: 'deployment_id' })
    deployment!: Deployment;

    @ManyToOne(() => Package, (pkg) => pkg.deploymentToPackages)
    @JoinColumn({ name: 'package_id' })
    package!: Package;

    @Column({ name: 'label' })
    label!: string;

    @Column({ name: 'original_label', nullable: true })
    originalLabel!: string | null;

    @Column({ name: 'original_deployment_id', nullable: true })
    originalDeploymentId!: number | null;

    @ManyToOne(() => Deployment, (deployment) => deployment.packageToDeployments)
    @JoinColumn({ name: 'original_deployment_id' })
    originalDeployment!: Deployment;

    @CreateDateColumn({ name: 'created_time' })
    createdTime!: Date;
} 