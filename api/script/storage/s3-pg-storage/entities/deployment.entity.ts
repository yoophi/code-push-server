import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { DeploymentToPackage } from '.';
import { App } from './app.entity';

@Entity('deployments')
export class Deployment {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    key!: string;

    @Column({ name: 'app_id' })
    appId!: number;

    @ManyToOne(() => App)
    @JoinColumn({ name: 'app_id' })
    app!: App;

    @OneToMany(() => DeploymentToPackage, (deploymentToPackage) => deploymentToPackage.deployment)
    packageToDeployments!: DeploymentToPackage[];

    @CreateDateColumn({ name: 'created_time' })
    createdTime!: Date;
} 