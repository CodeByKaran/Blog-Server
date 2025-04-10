import * as schema1 from "./user.model"; // Import your schema
import * as schema2 from "./blog.model"; // Import your schema
import * as schema3 from "./likes.model"; // Import your schema
import * as schema4 from "./comments.model"; // Import your schema
import * as schema5 from "./saves.model"; // Import your schema

export const schema = {
  ...schema1,
  ...schema2,
  ...schema3,
  ...schema4,
  ...schema5,
};
