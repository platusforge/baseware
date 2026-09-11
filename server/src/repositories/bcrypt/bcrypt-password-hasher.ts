import { hash as bcryptHash, verify } from "@node-rs/bcrypt";
import { env } from "@/env";
import { IPasswordHasher } from "@/types/repositories/saas-repositories";

export class BcryptPasswordHasher implements IPasswordHasher {
  async hash(plain: string): Promise<string> {
    return bcryptHash(plain, env.BCRYPT_COST);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    // Dummy-hash path (unknown users) may hold a non-bcrypt placeholder:
    // fail closed instead of throwing on malformed input.
    try {
      return await verify(plain, hashed);
    } catch {
      return false;
    }
  }
}
