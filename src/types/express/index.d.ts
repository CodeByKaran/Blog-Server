// Create a type declaration file (e.g., types/express/index.d.ts)
import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    // Extend Request interface
    interface Request {
      user:
        | JwtPayload & {
            id: string;
            username: string;
            image: string;
          };
      file?: Multer.File;
      files?:
        | {
            [fieldname: string]: Multer.File[];
          }
        | Multer.File[];
    }
  }
}
