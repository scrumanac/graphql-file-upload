import express from'express';
import { ApolloServer, gql } from 'apollo-server-express';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
import GraphQLUpload  from'graphql-upload/GraphQLUpload.mjs';
import {
  ApolloServerPluginLandingPageLocalDefault,
} from 'apollo-server-core';
import {createWriteStream} from 'fs';
import {join, parse} from 'path'
import * as url from 'url';


const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

function generateRandomString(length) {
    let result           = '';
    let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

const typeDefs = gql`
  scalar Upload

  type File {
   url: String!
  }

  type Query {
    otherFields: Boolean!
  }

  type Mutation {
   uploadFile (file: Upload!): File!
  }
`;

const resolvers = {
  Upload: GraphQLUpload,

  Query: {
    otherFields: () => false
  },

  Mutation: {
    uploadFile: async (parent, { file }) => {
      console.log({file})

         file.then((data) => {
          console.log(data)
         }).catch(err => console.log(err))

        const nfile = await file

        console.log({nfile})

      const { createReadStream, filename, mimetype, encoding } = await file;
      console.log({ createReadStream, filename, mimetype, encoding })

      const {ext} = parse(filename);

      const randomName = generateRandomString(12) + ext;

      const stream = createReadStream();
      const pathName = join(__dirname , `/public/images${randomName}`)


      await stream.pipe(createWriteStream(pathName));
  
      return {
        filename, 
        mimetype,
        encoding,
         url: `http://localhost:4000/images/${randomName}`,
      };
    },
  },
};

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    csrfPrevention: false,
    cache: 'bounded',
    plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
  });

  await server.start();

  const app = express();

  app.use(graphqlUploadExpress());
  server.applyMiddleware({ app});
app.use(express.static('public'))
  await new Promise(r => app.listen({ port: 4000 }, r));

  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
}

startServer();