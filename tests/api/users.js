process.env['testing'] = true;

var request = require('supertest'),
    app = require('./../../app'),
    createdBlogData = false,
    userId = "21dbfc670629ed3b226b8b41",
    User = require('../../models/user'),
    fs = require('fs'),
    _authorizedUser = JSON.parse(fs.readFileSync(__dirname + '/../_authorizedUser.json', 'utf8')),
    _unauthorizedUser = JSON.parse(fs.readFileSync(__dirname + '/../_unautherizedUser.json', 'utf8'))
    _authorizedUserToken = ""
;

describe('Expect 401 error with not Token is used', function() {
    var path = '/api/users'
    it('fails on GET', function(done) {
        request(app)
            .get(path)
            .expect(401)
            .end(done);
    });
    it('fails on POST', function(done) {
        request(app)
            .post(path)
            .send('emailAddress=' + _authorizedUser.emailAddress + '&password=' + _authorizedUser.password)
            .expect(401)
            .end(done);
    });
    it('fails on GET with ID', function(done) {
        request(app)
            .get(path + "/" + userId)
            .expect(401)
            .end(done);
    });
    it('fails on PUT', function(done) {
        request(app)
            .put(path + "/" + userId)
            .send('emailAddress=' + _authorizedUser.emailAddress + '&password=' + _authorizedUser.password)
            .expect(401)
            .end(done);
    });
    it('fails on DELETE', function(done) {
        request(app)
            .delete(path + "/" + userId)
            .expect(401)
            .end(done);
    });
});

describe('POST Requests to Users path', function() {
    before(function(done) {
        // We are going to add in article with a specfic id,
        // lets ensure its not there first.
        User.findByIdAndRemove(userId, function(err) {
            if (err) {
                console.log(err);
            }
            done();
        });
    });
    beforeEach(function(done) {
        request(app)
            .post('/api/authenticate')
            .send('emailAddress=' + _authorizedUser.emailAddress + '&password=' + _authorizedUser.password)
            .end(function(err, res) {
                if (err) {
                    console.log(err);
                }
                _authorizedUserToken = res.body.token;
                done();
            });
    });

    var path = '/api/users';
    it('Returns a 201 status code', function(done) {
        request(app)
            .post(path)
            .set('Authorization', 'Bearer ' + _authorizedUserToken)
            .send('_id='+userId+'&firstName=Admin&lastName=Strator&emailAddress=admin@local.host&password=test')
            .expect(201)
            .expect('Content-Type', /json/i)
            .expect(function(res) {
                if (res.body.firstName != "Admin") { throw new Error("Incorrect firstName Returned"); }
                if (res.body.lastName != "Strator") { throw new Error("Incorrect lastName Returned"); }
                if (res.body.emailAddress != "admin@local.host") { throw new Error("Incorrect emailAddress Returned"); }
                if (res.body.password) { throw new Error("Password should not be sent"); }
            })
            .end(done);
    });

    describe('Returns a 400 when', function() {
        it('posting without a firstName', function(done) {
            request(app)
                .post(path)
                .set('Authorization', 'Bearer ' + _authorizedUserToken)
                .send('lastName=Strator&emailAddress=admin@local.host&password=test')
                .expect(400)
                .expect('Content-Type', /json/i)
                .expect(function(res) {
                    if (!res.body.validationerrors) { throw new Error("Expected a Validation Errors"); }
                    if (!res.body.validationerrors.firstName) { throw new Error("Expected a Validation Error for firstName"); }
                })
                .end(done);
        });

        it('posting without a lastName', function(done) {
            request(app)
                .post(path)
                .set('Authorization', 'Bearer ' + _authorizedUserToken)
                .send('firstName=Strator&emailAddress=admin@local.host&password=test')
                .expect(400)
                .expect('Content-Type', /json/i)
                .expect(function(res) {
                    if (!res.body.validationerrors) { throw new Error("Expected a Validation Errors"); }
                    if (!res.body.validationerrors.lastName) { throw new Error("Expected a Validation Error for lastName"); }
                })
                .end(done);
        });

        it('posting without a emailAddress', function(done) {
            request(app)
                .post(path)
                .set('Authorization', 'Bearer ' + _authorizedUserToken)
                .send('firstName=Admin&lastName=Strator&password=test')
                .expect(400)
                .expect('Content-Type', /json/i)
                .expect(function(res) {
                    if (!res.body.validationerrors) { throw new Error("Expected a Validation Errors"); }
                    if (!res.body.validationerrors.emailAddress) { throw new Error("Expected a Validation Error for emailAddress"); }
                })
                .end(done);
        });

        it('posting without a password', function(done) {
            request(app)
                .post(path)
                .set('Authorization', 'Bearer ' + _authorizedUserToken)
                .send('firstName=Admin&lastName=Strator&emailAddress=admin@local.host')
                .expect(400)
                .expect('Content-Type', /json/i)
                .expect(function(res) {
                    if (!res.body.validationerrors) { throw new Error("Expected a Validation Errors"); }
                    if (!res.body.validationerrors.password) { throw new Error("Expected a Validation Error for password"); }
                })
                .end(done);
        });

    });

});

describe('POST Requests to Users With unAuthed Token', function() {
    beforeEach(function(done) {
        request(app)
            .post('/api/authenticate')
            .send('emailAddress=' + _unauthorizedUser.emailAddress + '&password=' + _unauthorizedUser.password)
            .end(function(err, res) {
                if (err) {
                    console.log(err);
                }
                _authorizedUserToken = res.body.token;
                done();
            });
    });
    var path = '/api/users';
    it('Returns a 401 status code', function(done) {
        request(app)
            .post(path)
            .set('Authorization', 'Bearer ' + _authorizedUserToken)
            .send('_id='+userId+'&firstName=Admin&lastName=Strator&emailAddress=admin@local.host&password=test')
            .expect(401)
            .expect('Content-Type', /json/i)
            .end(done);
    });
});

describe('GET Requests to Users path', function() {
    beforeEach(function(done) {
        request(app)
            .post('/api/authenticate')
            .send('emailAddress=' + _authorizedUser.emailAddress + '&password=' + _authorizedUser.password)
            .end(function(err, res) {
                if (err) {
                    console.log(err);
                }
                _authorizedUserToken = res.body.token;
                done();
            });
    });
    describe('list path', function() {
        var path = '/api/users';
        it('Returns a 200 status code', function(done) {
            request(app)
                .get(path)
                .set('Authorization', 'Bearer ' + _authorizedUserToken)
                .expect(200)
                .end(done);
        });

        it('Returns JSON', function(done) {
            request(app)
                .get(path)
                .set('Authorization', 'Bearer ' + _authorizedUserToken)
                .expect('Content-Type', /json/i)
                .end(done);
        });

        it('Returns JSON Array', function(done) {
            request(app)
                .get(path)
                .set('Authorization', 'Bearer ' + _authorizedUserToken)
                .expect(function(res) {
                    if (typeof(res.body) == "Array") { throw new Error("Expected an Array"); }
                    if (res.body[0].password) { throw new Error("Password should not be sent"); }
                })
                .end(done);
        });
    });

    describe('view path', function() {
        var path = '/api/users/'+userId;
        it('Returns a 200 status code ['+path+']', function(done) {
            request(app)
                .get(path)
                .set('Authorization', 'Bearer ' + _authorizedUserToken)
                .expect(200)
                .end(done);
        });

        it('Returns JSON', function(done) {
            request(app)
                .get(path)
                .set('Authorization', 'Bearer ' + _authorizedUserToken)
                .expect('Content-Type', /json/i)
                .end(done);
        });

        it('Returns JSON Object', function(done) {
            request(app)
                .get(path)
                .set('Authorization', 'Bearer ' + _authorizedUserToken)
                .expect(function(res) {
                    if (typeof(res.body) == "Object") { throw new Error("Expected an Object"); }
                    if (res.body.password) { throw new Error("Password should not be sent"); }
                })
                .end(done);
        });

        it('Returns Admin', function(done) {
            request(app)
                .get(path)
                .set('Authorization', 'Bearer ' + _authorizedUserToken)
                .expect(/Admin/gi)
                .end(done);
        });

        it('Returns 404 when invalid ID is passed', function(done) {
            request(app)
                .get(path.replace(/4/g,'6'))
                .set('Authorization', 'Bearer ' + _authorizedUserToken)
                .expect(404)
                .end(done);
        });

    });
});

describe('PUT Requests to Users With Authed Token', function() {
    beforeEach(function(done) {
        request(app)
            .post('/api/authenticate')
            .send('emailAddress=' + _authorizedUser.emailAddress + '&password=' + _authorizedUser.password)
            .end(function(err, res) {
                if (err) {
                    console.log(err);
                }
                _authorizedUserToken = res.body.token;
                done();
            });
    });
    var path = '/api/users/'+userId;
    it('Returns a 202 status code', function(done) {
        request(app)
            .put(path)
            .set('Authorization', 'Bearer ' + _authorizedUserToken)
            .send('lastName=Strator+Renamed')
            .expect(/Strator\sRenamed/i)
            .expect(202)
            .expect('Content-Type', /json/i)
            .expect(function(res) {
                if (res.body.lastName != "Strator Renamed") { throw new Error("Incorrect LastName Returned"); }
                if (res.body.password) { throw new Error("Password should not be sent"); }
            })
            .end(done);
    });
});

describe('PUT Requests to Users With unAuthed Token', function() {
    beforeEach(function(done) {
        request(app)
            .post('/api/authenticate')
            .send('emailAddress=' + _unauthorizedUser.emailAddress + '&password=' + _unauthorizedUser.password)
            .end(function(err, res) {
                if (err) {
                    console.log(err);
                }
                _authorizedUserToken = res.body.token;
                done();
            });
    });
    var path = '/api/users/'+userId;
    it('Returns a 401 status code', function(done) {
        request(app)
            .put(path)
            .set('Authorization', 'Bearer ' + _authorizedUserToken)
            .send('lastName=Strator+Renamed')
            .expect(401)
            .expect('Content-Type', /json/i)
            .end(done);
    });
});

describe('DELETE Requests to Users With unAuthed Token', function() {
    beforeEach(function(done) {
        request(app)
            .post('/api/authenticate')
            .send('emailAddress=' + _unauthorizedUser.emailAddress + '&password=' + _unauthorizedUser.password)
            .end(function(err, res) {
                if (err) {
                    console.log(err);
                }
                _authorizedUserToken = res.body.token;
                done();
            });
    });
    var path = '/api/users/'+userId;

    it('Returns a 401 status code', function(done) {
        request(app)
            .delete(path)
            .set('Authorization', 'Bearer ' + _authorizedUserToken)
            .expect(401)
            .end(done);
    });
});

describe('DELETE Requests to Users With Authed Token', function() {
    beforeEach(function(done) {
        request(app)
            .post('/api/authenticate')
            .send('emailAddress=' + _authorizedUser.emailAddress + '&password=' + _authorizedUser.password)
            .end(function(err, res) {
                if (err) {
                    console.log(err);
                }
                _authorizedUserToken = res.body.token;
                done();
            });
    });
    var path = '/api/users/'+userId;
    it('Returns a 204 status code', function(done) {
        request(app)
            .delete(path)
            .set('Authorization', 'Bearer ' + _authorizedUserToken)
            .expect(204)
            .end(done);
    });
    it('User can no longer be found', function(done) {
        request(app)
            .get(path)
            .set('Authorization', 'Bearer ' + _authorizedUserToken)
            .expect(404)
            .expect('Content-Type', /json/i)
            .end(done);
    });
});
