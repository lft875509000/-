var express = require('express');
var router = express.Router();
var User = require('../models/User');
var Content = require('../models/Content');
// 统一返回格式
var responseData;

router.use(function (req, res, next) {
    responseData = {
        code: 0,
        message: '',
        userInfo: {}
    };
    next();
});


/*
* 用户注册
*   注册的逻辑
*       1. 用户名不能为空
*       2. 密码不能为空
*       3. 两次输入密码必须一致
*   服务端验证：
*       1. 用户是否已经注册了，需要用到数据库的查询
*       2.
* */

router.post('/user/register', function (req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    var repassword = req.body.repassword;

    // 判断用户名是否为空
    if (username == '') {
        responseData.code = 1;
        responseData.message = '用户名不能为空';
        res.json(responseData);
        return
    }
    //密码不能为空
    if (password == '') {
        responseData.code = 2;
        responseData.message = '密码不能为空';
        res.json(responseData);
        return
    }
    // 两次输入的密码需一致
    if (password != repassword) {
        responseData.code = 3;
        responseData.message = '两次密码需一致';
        res.json(responseData);
        return
    }

    // 用户名是否被注册，如果数据库中有同名的数据，则已经被注册了
    User.findOne({
        username: username
    }).then(function (userInfo) {
        if (userInfo) {
            // 判断是否含有这条数据
            responseData.code = 4;
            responseData.message = '用户名已经注册';
            res.json(responseData);
            return;
        }
        // 保存用户注册的信息到数据库中
        var user = new User({
            username: username,
            password: password
        });
        return user.save();
    }).then(function (newUserInfo) {
        // console.log(newUserInfo);
        responseData.message = '注册成功';
        res.json(responseData);
        return;
    });
});

// 登录
router.post('/user/login', function (req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    let userInfo;

    if (username == '' || password == '') {
        responseData.code = 1;
        responseData.message = '用户名和密码不能为空';
        res.json(responseData);
        return
    }

    // 查询数据库中相同的用户名和密码记录是否存在，如果存在则登录成功
    User.findOne({
        username: username,
        password: password
    }).then(function (userInfo) {
        if (!userInfo) {
            responseData.code = 2;
            responseData.message = '用户名或密码错误';
            res.json(responseData);
            return;
        }
        // 用户名和密码时正确的
        responseData.message = '登录成功';
        responseData.userInfo = {
            _id: userInfo._id,
            username: userInfo.username
        };
        req.cookies.set('userInfo', JSON.stringify({
            _id: userInfo._id,
            username: userInfo.username
        }));

        res.json(responseData);
        return;
    })
});
/**
 *退出
 **/
router.get('/user/logout', function (req, res) {
    req.cookies.set('userInfo', null);
    res.json(responseData)
});

/*
* 获取评论
* */
router.get('/comment',function (req,res) {
    var contentId = req.query.contentid || '';

    Content.findOne({
        _id: contentId
    }).then(function (content) {
        responseData.data = content.comments;
        res.json(responseData);
    })
});

/*
*  获取指定文章的评论
* */
router.get('/comment',function (req,res) {
    var contentId = req.body.contentid || '';
    Content.findOne({
        _id: contentId
    }).then(function (content) {
        responseData.data = content.comments;
        res.json(responseData)
    })
})

/*
* 提交评论
* */
router.post('/comment/post', function (req,res,next) {
    //内容的id
    var contentId = req.body.contentid || '';
    var postData = {
        username: req.userInfo.username,
        postTime: new Date(),
        content: req.body.content
    };

    // 查询当前这篇内容的信息
    Content.findOne({
        _id: contentId
    }).then(function (content) {
        content.comments.push(postData);
        return content.save();
    }).then(function (newContent) {
        responseData.message = '评论成功';
        responseData.data = newContent;
        res.json(responseData)
    })
});


module.exports = router;