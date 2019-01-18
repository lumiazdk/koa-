const Router = require('koa-router');

let router = new Router();

//添加post
router.post('addPost', async ctx => {
    let { aid, title, content } = ctx.request.fields ? ctx.request.fields : {}
    if (!aid) {
        ctx.results.error('aid为必传')
        return
    }
    if (!title) {
        ctx.results.error('title为必传')
        return
    }
    if (!content) {
        ctx.results.error('content为必传')
        return
    }
    let isAid = await ctx.db.query('select * from users where id=?', [aid])
    if (isAid.length == 0) {
        ctx.results.error('该用户不存在')
    } else {
        await ctx.db.query('insert into post (aid,title,content) values (?,?,?)', [aid, title, content])
        ctx.results.success({}, '添加成功')
    }

})

//添加分类
router.post('addCategory', async ctx => {
    let { name } = ctx.request.fields ? ctx.request.fields : {}

    if (!name) {
        ctx.results.error('name为必传')
        return
    }
    let ishave = await ctx.db.query('select * from category where name=?', [name])
    if (ishave.length > 0) {
        ctx.results.error('该分类已存在')
    } else {
        await ctx.db.query('insert into category (name) values (?)', [name])
        ctx.results.success({}, '添加成功')
    }
})

//添加标签
router.post('addTag', async ctx => {
    let { name } = ctx.request.fields ? ctx.request.fields : {}

    if (!name) {
        ctx.results.error('name为必传')
        return
    }
    let ishave = await ctx.db.query('select * from tag where name=?', [name])
    if (ishave.length > 0) {
        ctx.results.error('该标签已存在')
    } else {
        await ctx.db.query('insert into tag (name) values (?)', [name])
        ctx.results.success({}, '添加成功')
    }
})

//打标签
router.post('addTagToPost', async ctx => {
    let { postid, tagid } = ctx.request.fields ? ctx.request.fields : {}

    if (!postid) {
        ctx.results.error('postid为必传')
        return
    }
    if (!tagid) {
        ctx.results.error('tagid为必传')
        return
    }
    let ispost = await ctx.db.query('select * from post where id=?', [postid])
    let istag = await ctx.db.query('select * from tag where id=?', [tagid])
    if (ispost.length == 0) {
        ctx.results.error('该文章不存在')
    } else if (istag.length == 0) {
        ctx.results.error('该标签不存在')
    } else {
        await ctx.db.query('insert into tag_relationship (postid,tagid) values (?,?)', [postid, tagid])
        ctx.results.success({}, '添加成功')
    }
})

router.post('getPost', async ctx => {
    let { page, pageSize, where } = ctx.request.fields ? ctx.request.fields : {}
    if (!/^[0-9]+$/.test(page)) {
        ctx.results.error('page为必传')
        return
    } else if (!/^[0-9]+$/.test(pageSize)) {
        ctx.results.error('pageSize为必传')
        return
    }
    let arr = []
    let searchQuery = ''
    if (JSON.stringify(where) != "{}") {
        for (let k in where) {
            arr.push(`${k}="${where[k]}"`)
        }
        // searchQuery = `where ${arr.toString()} and tag.tid=tag_relationship.tagid and tag_relationship.postid=post.id`
        searchQuery = `where ${arr.toString()}`

    } else {

    }
    let start = 0 + (page - 1) * 10
    // let data = await ctx.db.query(`select * from tag_relationship,tag,post ${searchQuery}`)
    let data = await ctx.db.query(`select * from post ${searchQuery} limit ?,?`, [start, parseInt(pageSize)])
    let result = []
    for (let item of Array.from(data)) {
        let data = await ctx.db.query(`select name,tid,postId from tag_relationship,tag,post where postId=? and tag.tid=tag_relationship.tagid and tag_relationship.postid=post.id`, [item.id])
        item.tagInfo = data
        result.push(item)
    }
    let total = await ctx.db.query('select count(*) from post')
    let pageInfo = {
        total: total[0]['count(*)'],
        page,
        pageSize
    }
    ctx.results.success({ result, pageInfo })
})

module.exports = router.routes();