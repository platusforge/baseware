import bcrypt from "bcrypt";
import { env } from "@/env";
import { IPasswordHasher } from "@/types/repositories/saas-repositories";

export class BcryptPasswordHasher implements IPasswordHasher {
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, env.BCRYPT_COST);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
