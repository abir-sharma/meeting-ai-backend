import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './entities/user.entity';
import { AuthIdentity, AuthIdentitySchema } from '../auth/entities/auth_identities.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AuthIdentity.name, schema: AuthIdentitySchema }

    ])
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]   // ⭐ VERY IMPORTANT
})
export class UsersModule {}