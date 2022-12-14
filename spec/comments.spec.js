import supertest from "supertest"
import mongoose, { trusted } from "mongoose"
import app from "../app.js"
import { cleanUpDatabase, generateValidJwt } from "./utils.js"
import User from "../models/User.js"
import Category from "../models/Category.js"
import Sound from "../models/Sound.js"
import Comment from "../models/Comment.js"

beforeEach(cleanUpDatabase);

// GET COMMENTS ROUTE OPTIONS TEST
describe('OPTIONS /comments', function(){
    test('should return a list of allowed methods without needing a token', async function(){
      const res = await supertest(app)
      .options('/comments')
      .expect(204)
      .expect('Allow', 'GET, POST, PATCH, DELETE, OPTIONS')
    });
  });

// CREATE COMMENT TEST
describe('POST /comments', function() {
    let Jules;
    let Stephane;
    let Nature;
    let Sound1;
    beforeEach(async function() {
        cleanUpDatabase();
        [Jules, Stephane, Nature] = await Promise.all([
        User.create({
            username: 'Jules',
            email: 'jules@sandoz.com',
            clearPassword: 'Test1234'
        }),
        User.create({
            username: 'Stephane',
            email: 'stephane@gmail.com',
            clearPassword: 'Test1234'
        }),
        Category.create({
            name: 'Nature',
            color: '#0000'
        })
        ]);
        Sound1 = await Sound.create({
            user: Jules._id,
            category: Nature._id,
            location: {type: "Point", coordinates: [46.781230, 6.647310]},
            sound: '   ftypM4A     M4A isommp42   mdat      �< �@��=�M*+�BN/�e_�\��G���:�@���RhM�O�΁ Pj8�=���4�y�� 1\{�1����^1��v�O������Ɲ���*eR����M$��eO�+��@��΂�|��Q�A�2sm'
        });
    });
        test("should create a comment on user's own sound" , async function(){
            const token = await generateValidJwt(Jules);
            const res = await supertest(app)
            .post('/comments')
            .set('Authorization', `Bearer ${token}`)
            .send({
                sound: Sound1._id,
                comment: 'This is a comment'
            })
            .expect(201)
            .expect('Content-Type', /text/)
            .expect('Comment successfully created')
        });
        test("should create a comment on another user's sound" , async function(){
            const token = await generateValidJwt(Stephane);
            const res = await supertest(app)
            .post('/comments')
            .set('Authorization', `Bearer ${token}`)
            .send({
                sound: Sound1._id,
                comment: 'This is a comment'
            })
            .expect(201)
            .expect('Content-Type', /text/)
            .expect('Comment successfully created')
        });
        test("should not create a comment if user is not logged in" , async function(){
            const res = await supertest(app)
            .post('/comments')
            .send({
                sound: Sound1._id,
                comment: 'This is a comment'
            })
            .expect(401)
            .expect('Content-Type', /text/)
            .expect('Authorization header is missing')
        });
        test("should not create a comment if sound does not exist" , async function(){
            const token = await generateValidJwt(Stephane);
            const res = await supertest(app)
            .post('/comments')
            .set('Authorization', `Bearer ${token}`)
            .send({
                sound: '5f9f9f9f9f9f9f9f9f9f9f9f',
                comment: 'This is a comment'
            })
            .expect(404)
            .expect('Content-Type', /text/)
            .expect('Sound not found')
        });
        test("should not create a comment if comment is empty" , async function(){
            const token = await generateValidJwt(Stephane);
            const res = await supertest(app)
            .post('/comments')
            .set('Authorization', `Bearer ${token}`)
            .send({
                sound: Sound1._id,
                comment: ''
            })
            .expect(500)
            .expect('Content-Type', /text/)
            .expect('Comment validation failed: comment: Comment cannot be empty')
        });

});

// GET COMMENTS TEST
describe('GET /comments', function() {
    let Jules, Stephane, Nature, Sound1, Sound2, Comment1, Comment2, Comment3;
    beforeEach(async function() {
        await User.deleteMany();
        await Sound.deleteMany();
        await Comment.deleteMany();
        [Jules, Stephane, Nature] = await Promise.all([
        User.create({
            username: 'Jules',
            email: 'jules@sandoz.com',
            clearPassword: 'Test1234'
        }),
        User.create({
            username: 'Stephane',
            email: 'stephane@gmail.com',
            clearPassword: 'Test1234'
        }),
        Category.create({
            name: 'Nature',
            color: '#0000'
        })
        ]);
        [Sound1, Sound2] = await Promise.all([
            Sound.create({
            user: Jules._id,
            category: Nature._id,
            location: {type: "Point", coordinates: [46.781230, 6.647310]},
            sound: '   ftypM4A     M4A isommp42   mdat      �< �@��=�M*+�BN/�e_�\��G���:�@���RhM�O�΁ Pj8�=���4�y�� 1\{�1����^1��v�O������Ɲ���*eR����M$��eO�+��@��΂�|��Q�A�2sm'
        }),
        Sound.create({
            user: Stephane._id,
            category: Nature._id,
            location: {type: "Point", coordinates: [46.781231, 6.647320]},
            sound: '   ftypM4A     M4A isommp42   mdat      �< �@��=�M*+�BN/�e_�\��G���:�@���RhM�O�΁ Pj8�=���4�y�� 1\{�1����^1��v�O������Ɲ���*eR����M$��eO�+��@��΂�|��Q�A�2sm'
        })
    ]);
        Comment1= await Comment.create({
                author: Stephane._id,
                sound: Sound2._id,
                comment: 'This is comment 2'
            });
        [Comment2, Comment3] = await Promise.all([
            Comment.create({
                author: Jules._id,
                sound: Sound1._id,
                comment: 'This is comment 1'
            }),
            Comment.create({
                author: Jules._id,
                sound: Sound2._id,
                comment: 'This is comment 3'
            })
        ]);
    });
    test("should get all comments", async function(){
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
        .get('/comments')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /json/)
        expect(res.body).toBeArray()
        expect(res.body[0]).toHaveProperty('author')
        expect(res.body[0]).toHaveProperty('sound')
        expect(res.body[0]).toHaveProperty('comment')
    });
    test("should get all comments on a sound", async function(){
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
        .get(`/comments?sound=${Sound1._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /json/)
        expect(res.body).toBeArray()
        expect(res.body[0]).toHaveProperty('author')
        expect(res.body[0]).toHaveProperty('sound')
        expect(res.body[0]).toHaveProperty('comment')
});
    test("should not get comments if sound is invalid", async function(){
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
        .get(`/comments?sound=5f9f9f9f9f9f9f9f9f9f9f9f`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
        .expect('Content-Type', /text/)
        .expect('Sound not found')
    });
    test("should get all comments by a user", async function(){
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
        .get(`/comments?user=${Jules.username}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /json/)
        expect(res.body).toBeArray()
        expect(res.body[0]).toHaveProperty('author')
        expect(res.body[0]).toHaveProperty('sound')
        expect(res.body[0]).toHaveProperty('comment')
    });
    test("should not get comments if user is invalid", async function(){
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
        .get(`/comments?user=5f9f9f9f9f9f9f9f9f9f9f9f`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
        .expect('Content-Type', /text/)
        .expect('User not found')
    });
    test("should get all comments by a user on a sound", async function(){
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
        .get(`/comments?user=${Jules.username}&sound=${Sound1._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /json/)
        expect(res.body).toBeArray()
        expect(res.body[0]).toHaveProperty('author')
        expect(res.body[0]).toHaveProperty('sound')
        expect(res.body[0]).toHaveProperty('comment')
    });
    test("should not get comments for a user on a sound if user is invalid", async function(){
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
        .get(`/comments?user=${Jules.username}a&sound=${Sound1._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
        .expect('Content-Type', /text/)
        .expect('User not found')
    });
    test("should get comments offset by 1", async function(){
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
        .get(`/comments?offset=1`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /json/)
        expect(res.body).toBeArray()
        expect(res.body[0]).toHaveProperty('author')
        expect(res.body[0].author.username).toEqual(Jules.username)
        expect(res.body[0]).toHaveProperty('sound')
        expect(res.body[0]).toHaveProperty('comment')
    });
    test("should get list of comments limited to 2 comments", async function(){
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
        .get(`/comments?limit=2`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /json/)
        expect(res.body).toBeArray()
        expect(res.body).toHaveLength(2)
        expect(res.body[0]).toHaveProperty('author')
        expect(res.body[0]).toHaveProperty('sound')
        expect(res.body[0]).toHaveProperty('comment')
    });
    
});

//PATCH COMMENT TEST
describe("PATCH /comments/:id", function(){
    let Jules, Stephane, Sound1, Comment1, Comment2, Comment3, Nature;
    beforeEach(async function(){
        await User.deleteMany();
        await Sound.deleteMany();
        await Comment.deleteMany();
        [Jules, Stephane] = await Promise.all([
            User.create({
                username: 'Jules',
                clearPassword: 'Test1234',
                email: 'jules@sandoz.com'
            }),
            User.create({
                username: 'Stephane',
                clearPassword: 'Test1234',
                email: 'stephane@gmail.com'
            })
        ]);
        Nature = await Category.create({
            name: 'Nature',
            color: '#00FF00'
        });
        Sound1 = await Sound.create({
            user: Jules._id,
            category: Nature._id,
            location: {type: "Point", coordinates: [46.781230, 6.647310]},
            sound: '   ftypM4A     M4A isommp42   mdat      �< �@��=�M*+�BN/�e_�\��G���:�@���RhM�O�΁ Pj8�=���4�y�� 1\{�1����^1��v�O������Ɲ���*eR����M$��eO�+��@��΂�|��Q�A�2sm'
        }),
            Comment1 = await Comment.create({
                author: Jules._id,
                sound: Sound1._id,
                comment: 'This is a comment'
            });
            Comment2 = await Comment.create({
                author: Jules._id,
                sound: Sound1._id,
                comment: 'This is a comment 2'
            });
            Comment3 = await Comment.create({
                author: Stephane._id,
                sound: Sound1._id,
                comment: 'This is a comment 3'
            });
    });
    test("should update a comment", async function(){
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
        .patch(`/comments/${Comment1._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({comment: 'This is a new comment'})
        // .expect(200)
        .expect('Content-Type', /text/)
        .expect('Comment successfully updated')
    });
    test("should not update a comment if user is not the author and not admin", async function(){
        const token = await generateValidJwt(Stephane);
        const res = await supertest(app)
        .patch(`/comments/${Comment1._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({comment: 'This is a new comment'})
        .expect(401)
        .expect('Content-Type', /text/)
        .expect('You are not authorized to edit this comment')
    });
    test("should update a comment if user is not author but is admin", async function(){
        const token = await generateValidJwt(Stephane, true);
        const res = await supertest(app)
        .patch(`/comments/${Comment1._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({comment: 'This is a new comment'})
        .expect(200)
        .expect('Content-Type', /text/)
        .expect('Comment successfully updated')
    });
    test("should not update a comment if comment is not found", async function(){
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
        .patch(`/comments/${Comment1._id}a`)
        .set('Authorization', `Bearer ${token}`)
        .send({comment: 'This is a new comment'})
        .expect(404)
        .expect('Content-Type', /text/)
        .expect('Comment not found')
    });
    test("should not update a comment if comment is empty", async function(){
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
        .patch(`/comments/${Comment1._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({comment: ''})
        .expect(400)
        .expect('Content-Type', /text/)
        .expect('Comment cannot be empty')
    });

});

//DELETE COMMENT TEST
describe("DELETE /comments/:id", function(){
    let Jules, Stephane, Sound1, Comment1, Comment2, Comment3, Nature;
    beforeEach(async function(){
        await User.deleteMany();
        await Sound.deleteMany();
        await Comment.deleteMany();
        [Jules, Stephane] = await Promise.all([
            User.create({
                username: 'Jules',
                clearPassword: 'Test1234',
                email: 'jules@sandoz.com'
            }),
            User.create({
                username: 'Stephane',
                clearPassword: 'Test1234',
                email: 'stephane@gmail.com'
            })
        ]);
        Nature = await Category.create({
            name: 'Nature',
            color: '#00FF00'
        });
        Sound1 = await Sound.create({
            user: Jules._id,
            category: Nature._id,
            location: {type: "Point", coordinates: [46.781230, 6.647310]},
            sound: '   ftypM4A     M4A isommp42   mdat      �< �@��=�M*+�BN/�e_�\��G���:�@���RhM�O�΁ Pj8�=���4�y�� 1\{�1����^1��v�O������Ɲ���*eR����M$��eO�+��@��΂�|��Q�A�2sm'
        }),
        Comment1 = await Comment.create({
            author: Jules._id,
            sound: Sound1._id,
            comment: 'This is a comment'
        });
        Comment2 = await Comment.create({
            author: Jules._id,
            sound: Sound1._id,
            comment: 'This is a comment 2'
        });
        Comment3 = await Comment.create({
            author: Stephane._id,
            sound: Sound1._id,
            comment: 'This is a comment 3'
        });
    });
    test("should delete a comment", async function(){
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
        .delete(`/comments/${Comment1._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /text/)
        .expect('Comment successfully deleted')
    });
    test("should not delete a comment if user is not the author and not admin", async function(){
        const token = await generateValidJwt(Stephane);
        const res = await supertest(app)
        .delete(`/comments/${Comment1._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(401)
        .expect('Content-Type', /text/)
        .expect('You are not authorized to delete this comment')
    });
    test("should delete a comment if user is not author but is admin", async function(){
        const token = await generateValidJwt(Stephane, true);
        const res = await supertest(app)
        .delete(`/comments/${Comment1._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /text/)
        .expect('Comment successfully deleted')
    });
    test("should not delete a comment if comment is not found", async function(){
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
        .delete(`/comments/${Comment1._id}a`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
        .expect('Content-Type', /text/)
        .expect('Comment not found')
    });
});


  afterAll(async () => {
    await mongoose.disconnect();
  });