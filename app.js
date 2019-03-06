const xml2js = require('xml2js')
const fs = require('fs')
const Turndown = require('turndown')

const parser = new xml2js.Parser()
const converter = new Turndown({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**'
})
const data = fs.readFileSync('./wordpress.2018-12-03.xml')
parser.parseString(data, (err, result) => {
    if(err) return
    const post = result.rss.channel[0].item.filter(value => value['wp:post_type'].includes('post'))
    post.map(value => {
        const temp = {}
        temp.title = value['title'][0]
        temp.tag = value['category'].filter(value=>value.$['domain']==='post_tag').map(value=>value['_'])
        temp.category = value['category'].filter(value=>value.$['domain']==='category').map(value=>value['_'])
        temp.html = value['content:encoded'][0] || ''
        temp.createDate = value['wp:post_date_gmt'][0]
        temp.updateDate = value['wp:post_date'][0]
        temp.status = value['wp:status'][0]
        temp.author = value['dc:creator'][0]
        temp.markdown = converter.turndown(temp.html)
        temp.yaml = `---
title: "${temp.title}"
author: "${temp.author}"
date: "${temp.updateDate}"
createDate: "${temp.createDate}"
updateDate: "${temp.updateDate}"
tag: ["${temp.tag.join('", "')}"]
category: ["${temp.category.join('", "')}"]
status: "${temp.status}"
---

`
        return temp
    }).forEach(value => {
        // 文件名
        const filename = value.title.replace(/[./\\*?:<>|]/g, '') || '未命名' + Math.floor(Math.random() * 1000000)
        fs.writeFileSync(`./note/${filename}.md`, value.yaml + value.markdown, 'utf8')
        fs.writeFileSync(`./note/${filename}.json`, JSON.stringify(value, null, 2), 'utf8')
    })
    console.log('写入完成')
})