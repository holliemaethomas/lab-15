'use strict';

process.env.STORAGE = 'mongo';

import jwt from 'jsonwebtoken';
import {server} from '../../../src/app.js';

import supergoose, { startDB, stopDB } from '../../supergoose.js';

const mockRequest = supergoose(server);

beforeAll(startDB);
afterAll(stopDB);

describe('Auth Router', () => {
  
  let users = {
    admin: {username: 'admin', password: 'password', role: 'admin'},
    editor: {username: 'editor', password: 'password', role: 'editor'},
    user: {username: 'user', password: 'password', role: 'user'},
  };
  
  Object.keys(users).forEach( userType => {
    
    describe(`${userType} users`, () => {
      
      let encodedToken;
      let id;
      
      it('can create one', () => {
        return mockRequest.post('/signup')
          .send(users[userType])
          .then(results => {
            var token = jwt.verify(results.text, process.env.SECRET || 'changeit');
            id = token.id;
            encodedToken = results.text;
            expect(token.id).toBeDefined();
            expect(token.capabilities).toBeDefined();
          });
      });

      it('can signin with basic', () => {
        return mockRequest.post('/signin')
          .auth(users[userType].username, users[userType].password)
          .then(results => {
            var token = jwt.verify.(results.text, process.env.SECRET || 'changeit');
            expect(token.id).toEqual(id);
            expect(token.capabilities).toBeDefined();
          });
      });

      it('can signin with bearer', () => {
        return mockRequest.post('/signin')
          .set('Authorization', `Bearer ${encodedToken}`)
          .then(results => {
            var token = jwt.verify(results.text, process.env.SECRET || 'changeit');
            expect(token.id).toEqual(id);
            expect(token.capabilities).toBeDefined();
          });
      }); 
      
    });
    
  });
  
  /* 
    app.get('/', auth(), (req,res) => {
      res.send('hi');
    });

    app.get('/s', auth('create'), (req,res) => {
      res.send('hi');
    });

    app.get('/d', auth('delete'), (req,res) => {
      res.send('hi');
    });
   */
  
});