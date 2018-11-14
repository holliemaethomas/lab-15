'use strict';

import { startDB, stopDB } from '../../supergoose.js';

import auth from '../../../src/auth/middleware.js';
import Users from '../../../src/auth/model.js';

beforeAll(startDB);

let users = {
  admin: {username: 'admin', password: 'password', role: 'admin'},
  editor: {username: 'editor', password: 'password', role: 'editor'},
  user: {username: 'user', password: 'password', role: 'user'}
};

beforeAll(async (done) => {
  await startDB();
  const admin = await new Users(users.admin).save();
  const editor = await new Users(users.editor).save();
  const user = await new Users(users.user).save();
  done()
});

afterAll(stopDB);

/*
  For now, these test only make assertions on the admin user
  That user has a role with create, read, update, delete credentials
  ... you can go further as you please.
 */
describe('Auth Middleware', () => {
  
  // admin:password: YWRtaW46cGFzc3dvcmQ=
  // admin:foo: YWRtaW46Zm9v
  // editor:password: ZWRpdG9yOnBhc3N3b3Jk
  // user:password: dXNlcjpwYXNzd29yZA==
  
  let errorObject = {"message": "Invalid User ID/Password", "status": 401, "statusMessage": "Unauthorized"};
  
  describe('user authentication', () => {
    
    let cachedToken;

    it('fails a login for a user (admin) with the incorrect basic credentials', () => {

      let req = {
        headers: {
          authorization: 'Basic YWRtaW46Zm9v',
        },
      };
      let res = {};
      let next = jest.fn();
      let middleware = auth();

      return middleware(req, res, next)
        .then(() => {
          expect(next).toHaveBeenCalledWith(errorObject);
        });

    }); // it()

    it('fails a login for a user (admin) with an incorrect bearer token', () => {

      let req = {
        headers: {
          authorization: 'Bearer foo',
        },
      };
      let res = {};
      let next = jest.fn();
      let middleware = auth();

      // The token authorizer in the model throws an error, making it so
      // the middleware doesn't return a promise but instead throws an
      // error in the main catch block, so this assertion validates that
      // behavior instead of a standard promise signature
      middleware(req, res, next)
      expect(next).toHaveBeenCalledWith(errorObject);

    }); // it()

    it('logs in an admin user with the right credentials', () => {

      let req = {
        headers: {
          authorization: 'Basic YWRtaW46cGFzc3dvcmQ=',
        },
      };
      let res = {};
      let next = jest.fn();
      let middleware = auth();

      return middleware(req,res,next)
        .then( () => {
          cachedToken = req.token;
          expect(next).toHaveBeenCalledWith();
        });

    }); // it()

    // this test borrows the token gotten from the previous it() ... not great practice
    // but we're using an in-memory db instance, so we need a way to get the user ID
    // and token from a "good" login, and the previous passing test does provide that ...
    it('logs in an admin user with a correct bearer token', () => {

      let req = {
        headers: {
          authorization: `Bearer ${cachedToken}`
        },
      };
      let res = {};
      let next = jest.fn();
      let middleware = auth();

      return middleware(req,res,next)
      .then( () => {
        expect(next).toHaveBeenCalledWith();
      });

    }); // it()

  });

  describe('user authorization', () => {

    it('restricts access to a valid user without permissions', () => {

      let req = {
        headers: {
          authorization: 'Basic YWRtaW46cGFzc3dvcmQ=',
        },
      };
      let res = {};
      let next = jest.fn();
      let middleware = auth('godpower');

      return middleware(req,res,next)
        .then( () => {
          expect(next).toHaveBeenCalledWith(errorObject);
        });

    }); // it()

    it('grants access when a user has permission', () => {

      let req = {
        headers: {
          authorization: 'Basic YWRtaW46cGFzc3dvcmQ=',
        },
      };
      let res = {};
      let next = jest.fn();
      let middleware = auth('delete');

      return middleware(req,res,next)
        .then( () => {
          expect(next).toHaveBeenCalledWith();
        });

    }); // it()

  }); // describe()
    
});