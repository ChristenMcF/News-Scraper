var request = require("request");
var cheerio = require("cheerio");
var Comment = require("../models/Comment.js");
var Article = require("../models/Article.js");

module.exports = function (app) {

  app
    .get('/', function (req, res) {
      res.redirect('/articles');
    });

  app.get("/scrape", function (req, res) {

    request("https://petapixel.com/", function (error, response, html) {
      var $ = cheerio.load(html);
    $("article").each(function(i, element) {

      var result = {};

      result.title = $(this).children("h2").text();
      result.summary = $(this).children(".summary").text();
      result.link = $(this).children("h2").children("a").attr("href");

      var entry = new Article(result);

      entry.save(function(err, doc) {
     
        if (err) {
          console.log(err);
        }
      
        else {
          console.log(doc);
        }
      });

    });
        res.send("Scrape Complete");

  });

});
  app.get("/articles", function (req, res) {

    Article.find({}, function (error, doc) {
        if (error) {
          console.log(error
          );
        } else {
          res.render("index", {result: doc});
        }
      })
      .sort({'_id': -1});
  });
  app.get("/articles/:id", function (req, res) {

    Article.findOne({"_id": req.params.id})
      .populate("comment")
      .exec(function (error, doc) {

        if (error) {
          console.log(error);
        } else {
          res.render("comments", {result: doc});
        }
      });
  });

  app.post("/articles/:id", function (req, res) {

    Comment.create(req.body, function (error, doc) {
        if (error) {
          console.log(error);
        } else {
          Article.findOneAndUpdate({
            "_id": req.params.id
          }, {
            $push: {
              "comment": doc._id
            }
          }, {
            safe: true,
            upsert: true,
            new: true
          })
            .exec(function (err, doc) {
              if (err) {
                console.log(err);
              } else {
                res.redirect('back');
              }
            });
        }
      });
  });
  app.delete("/articles/:id/:commentid", function (req, res) {
    Comment
      .findByIdAndRemove(req.params.commentid, function (error, doc) {
        if (error) {
          console.log(error);
        } else {
          console.log(doc);
          Article.findOneAndUpdate({
            "_id": req.params.id
          }, {
            $pull: {
              "comment": doc._id
            }
          })
            .exec(function (err, doc) {
              if (err) {
                console.log(err);
              }
            });
        }
      });
  });
};