// const expressjwt = require('express-jwt');
const { expressjwt: jwt } = require("express-jwt");

function authJwt() {
  const secret = process.env.secret;
  const api = process.env.API_URL;
  
  return jwt({
    secret,
    algorithms: ["HS256"],
    // isRevoked: isRevoked
  }).unless({
    path: [
      { url: /\/api\/v1\/products(.*)/, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] },
      { url: /\/api\/v1\/categories(.*)/ , methods: ['GET', "POST", "PUT", "DELETE",'OPTIONS'] },
      { url: /\/api\/v1\/brands(.*)/ , methods: ['GET', "POST", "PUT", "DELETE", 'OPTIONS'] },
      { url: /\/public\/uploads(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/api\/v1\/orders(.*)/ , methods: ['GET','POST','PUT','OPTIONS'] },
      { url: /\/api\/v1\/users(.*)/ , methods: ['GET','POST','PUT','OPTIONS'] },
      { url: /\/api\/v1\/services(.*)/, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] },
      { url: /\/api\/v1\/serviceCategories(.*)/ , methods: ['GET', "POST", "PUT", "DELETE",'OPTIONS'] },
      { url: /\/api\/v1\/motorcycle(.*)/ , methods: ['GET', "POST", "PUT", "DELETE",'OPTIONS'] },
      { url: /\/api\/v1\/fuels(.*)/ , methods: ['GET', "POST", "PUT", "DELETE",'OPTIONS'] },
      { url: /\/api\/v1\/addresses(.*)/ , methods: ['GET', "POST", "PUT", "DELETE",'OPTIONS'] },
      { url: /\/api\/v1\/appointments(.*)/ , methods: ['GET', "POST", "PUT", "DELETE",'OPTIONS'] },
      { url: /\/api\/v1\/dashboards(.*)/ , methods: ['GET', "POST", "PUT", "DELETE",'OPTIONS'] },
      { url: /\/api\/v1\/feedbacks(.*)/ , methods: ['GET', "POST", "PUT", "DELETE",'OPTIONS'] },
      { url: /\/api\/v1\/supplierLogs(.*)/ , methods: ['GET', "POST", "PUT", "DELETE",'OPTIONS'] },
      { url: /\/api\/v1\/notifications(.*)/ , methods: ['GET', "POST", "PUT", "DELETE",'OPTIONS'] },
      `${api}/users`,
      `${api}/users/login`,
      `${api}/users/register`,
    ],
  });
}

async function isRevoked(req, payload, done) {
  if (payload.role !== "admin") {
    // If the user does not have the "admin" role, revoke access
    done(null, true);
  } else {
    // If the user has the "admin" role, grant access
    done();
  }
}


module.exports = authJwt;
