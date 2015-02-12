var express = require('express'),
    router = express.Router(),
    articles = [],
    bodyParser = require('body-parser'),
    urlencode = bodyParser.urlencoded({ extended: false }),
    mongoose = require('mongoose'),
    Article = require('../models/article')
;

router.route('/')
    .get(function(request, response) {
        Article.find(function (errors, articles) {
          if (errors) {
              response.status(500).json(errors);
              return;
          }
          response.status(200).json(articles);
        });
    }) // close get
    .post(urlencode, function(request, response) {
        var newArticle = request.body;

        var errors = {};
        if ( !newArticle.title ) { errors.title = "No title found"; }
        if ( !newArticle.summary ) { errors.summary = "No summary found"; }
        if ( !newArticle.body ) { errors.body = "No body found"; }

        if (Object.keys(errors).length > 0) {
            response.status(400).json({validationerrors: errors});
            return;
        }

        if ( !newArticle.publish_date ) {
            newArticle.publish_date = new Date();
        }
        if ( !newArticle.isDraft ) {
            newArticle.isDraft = true;
        }

        Article.create(newArticle, function (error, post) {
          if (error) {
              response.status(500).json(error);
              return;
          }
          response.status(201).json(post);
        });
    }) // close post
; // close route('/')

router.route('/:id')
    .get(function(request, response) {
        Article.findById(request.params.id, function (error, post) {
          if (error) {
              response.status(500).json(error);
              return;
          }
          if (post == null) {
              response.status(404).json("Not found");
              return;
          }
          response.status(200).json(post);
        });
    }) // close get
; // close route('/:index')

module.exports = router;
