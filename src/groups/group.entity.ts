import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
  } from 'typeorm';
  import { User } from '../user/user.entity'; 

  @Entity('groups')
  export class Group {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User) // Many holdings can belong to one user
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'name', type: 'varchar', length: 255})
    name: string;

    @Column({ name: 'value_usd', type: 'numeric', precision: 30, scale: 4, default: 0})
    value_usd: number;

    @Column({ name: 'value_sol', type: 'numeric', precision: 30, scale: 4, default: 0 })
    value_sol: number;

    @Column({ type: 'numeric', precision: 30, scale: 4, default: 0})
    pnl: number;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
  }