//采用事件中心订阅模式
//server 工具 命令  browser-sync start --server --files="**/*"
var EventCenter = {
        on: function(type, handler) {
            $(document).on(type, handler)
        },
        fire: function(type, data) {
            $(document).trigger(type, data)
        }
    }
    // EventCenter.on('hello',function(e,data){
    //     console.log(data)
    // })
    // EventCenter.fire('hello','nihao')
    // //模块化思想  模块1  方便管理与维护 
    // var Footer = {

// }
//老套路  footer 模块  模块化方便管理 
var Footer = {
    //初始化
    init: function() {
        this.$footer = $('footer')
        this.$ul = this.$footer.find('ul')
        this.$box = this.$footer.find('.box')
        this.$rightBtn = this.$footer.find('.icon-right')
        this.$leftBtn = this.$footer.find('.icon-left')
            //开关作用
        this.isToEnd = false
        this.isToStart = true
        this.isAnimate = false
        this.bind()
        this.render()
    },
    //绑定事件
    bind: function() {
        var _this = this
            //上一页 下一页事件  右边的翻页状态
        this.$rightBtn.on('click', function() {
                if (_this.isAnimate) return
                var itemWidth = _this.$box.find('li').outerWidth(true);
                var rowCount = Math.floor(_this.$box.width() / itemWidth)
                    //右边的翻页状态
                if (!_this.isToEnd) {
                    _this.isAnimate = true
                    _this.$ul.animate({
                        left: '-=' + rowCount * itemWidth
                    }, 400, function() {
                        _this.isAnimate = false
                        _this.isToStart = false
                        if (parseFloat(_this.$box.width()) - parseFloat(_this.$ul.css('left')) >= parseFloat(_this.$ul.css('width'))) {
                            _this.isToEnd = true
                            console.log('右边')
                        }
                    })
                }
            })
            //上一页 下一页事件  左边的翻页状态
        this.$leftBtn.on('click', function() {
                //防止用户点击过快
                if (_this.isAnimate) return
                var itemWidth = _this.$box.find('li').outerWidth(true);
                var rowCount = Math.floor(_this.$box.width() / itemWidth)
                    //右边的翻页状态
                if (!_this.isToStart) {
                    _this.isAnimate = true
                    _this.$ul.animate({
                        left: '+=' + rowCount * itemWidth
                    }, 400, function() {
                        _this.isAnimate = false
                        _this.isToEnd = false
                        if (parseFloat(_this.$ul.css('left')) >= 0) {
                            _this.isToStart = true
                            console.log('左边')
                        }
                    })
                }
            })
            //选定状态事件 事件代理  
        this.$footer.on('click', 'li', function() {
            $(this).addClass('active').siblings().removeClass('active');
            EventCenter.fire('select-albumn', {
                channelId: $(this).attr('data-channel-id'),
                channelName: $(this).attr('data-channel-name')
            })
        })
    },
    //渲染页面
    render: function() {
        var _this = this
        $.getJSON('https://jirenguapi.applinzi.com/fm/getChannels.php')
            .done(function(ret) {
                console.log(ret);
                //当数据到来的时候 开始执行渲染页面的操作 执行渲染页面的函数
                _this.renderFooter(ret.channels)
            }).fail(function() {
                console.log('加载失败');
            })
    },
    //动态加载 footer部分 html 请求过来的数据 进行拼接
    renderFooter: function(channels) {
        console.log(channels)
        var html = ''
        channels.forEach(function(channels) {
            html += '<li data-channel-id=' + channels.channel_id + ' data-channel-name=' + channels.name + '>' +
                '<div class="cover" style="background-image:url(' + channels.cover_small + ')"></div>' +
                '<h3>' + channels.name + '</h3>' +
                '</li>'
        })
        this.$ul.html(html)
        this.setStyle()
    },
    //设置li 的样式 
    setStyle: function() {
        console.log('你好');
        var count = this.$footer.find('li').length
            // li元素所有的宽度    outerWidth(true) 包括边距 
        var width = this.$footer.find('li').outerWidth(true);
        this.$ul.css({
            width: count * width + 'px'
        })
    }

}

//播放模块 
var Fm = {
        init: function() {
            this.$container = $('#page-music')
            this.audio = new Audio()
            this.audio.autoplay = true
            this.bind()
        },
        //自定义时间监听
        bind: function() {
            var _this = this
            EventCenter.on('select-albumn', function(e, channelObj) {
                    _this.channelId = channelObj.channelId
                    _this.channelName = channelObj.channelName
                    _this.loadMusic()
                })
                //播放設置 播放与暂停
            this.$container.find('.btn-play').on('click', function() {
                    var $btn = $(this)
                    if ($btn.hasClass('icon-bofang')) {
                        _this.audio.play()
                        $btn.removeClass('icon-bofang').addClass('icon-pause')
                    } else {
                        $btn.removeClass('icon-pause').addClass('icon-bofang')
                        _this.audio.pause()
                    }
                })
                //下一曲
            this.$container.find('.btn-next').on('click', function() {
                    _this.loadMusic()
                })
                //进度条事件 播放
            this.audio.addEventListener('play', function() {
                    // console.log('play')
                    clearInterval(_this.statusClock);
                    _this.statusClock = setInterval(function() {
                        _this.updateStatus()
                    }, 1000)
                })
                //暂停
            this.audio.addEventListener('pause', function() {
                console.log('pause')
                clearInterval(_this.statusClock);
            })
        },
        //请求数据 歌曲
        loadMusic(callback) {
            var _this = this
            $.getJSON('https://jirenguapi.applinzi.com/fm/getSong.php', { channel: this.channelId })
                .done(function(ret) {
                    _this.song = ret['song'][0]
                    _this.setMusic()
                    _this.loadLyric()
                })
        },
        //歌词
        loadLyric() {
            var _this = this
            $.getJSON('https://jirenguapi.applinzi.com/fm/getLyric.php', { sid: this.song.sid }).done(function(ret) {
                var lyric = ret.lyric
                console.log(_this.lyricObj)
                var lyricObj = {}
                lyric.split('\n').forEach(function(line) {
                    //[01:10.25][01:20.25]It a new day
                    var times = line.match(/\d{2}:\d{2}/g)
                        //times == ['01:10.25', '01:20.25']
                    var str = line.replace(/\[.+?\]/g, '')
                    if (Array.isArray(times)) {
                        times.forEach(function(time) {
                            lyricObj[time] = str
                        })
                    }
                })
                _this.lyricObj = lyricObj
            })
        },
        //操作数据 播放音乐 修改背景图片 
        setMusic() {
            console.log('set music ...')
            console.log(this.song)
                // 音乐
            this.audio.src = this.song.url
                //背景图片
            $('.bg').css('background-image', 'url(' + this.song.picture + ')')
            this.$container.find('.aside figure').css('background-image', 'url(' + this.song.picture + ')')
            this.$container.find('.detail h1').text(this.song.title)
            this.$container.find('.detail .author').text(this.song.artist)
            this.$container.find('.tag').text(this.channelName)
            this.$container.find('.btn-play').removeClass('icon-bofang').addClass('icon-pause')
        },
        //进度条
        updateStatus() {
            var _this = this
                // console.log('geng') 分秒 设置
            var min = Math.floor(this.audio.currentTime / 60)
            var second = Math.floor(Fm.audio.currentTime % 60) + ''
            second = second.length === 2 ? second : '0' + second
            this.$container.find('.current-time').text(min + ':' + second)
                //进度条 duration 属性返回当前音频的长度
            this.$container.find('.bar-progress').css('width', this.audio.currentTime / this.audio.duration * 100 + '%')
            console.log(this.lyricObj)
            var line = this.lyricObj['0' + min + ':' + second]
            if (line) {
                this.$container.find('.lyric p').text(line)
                    .boomText()

            }
        }
    }
    //自定义动画
$.fn.boomText = function(type) {
    type = type || 'rollIn'
    console.log(type)
    this.html(function() {
        var arr = $(this).text()
            .split('').map(function(word) {
                return '<span class="boomText">' + word + '</span>'
            })
        return arr.join('')
    })

    var index = 0
    var $boomTexts = $(this).find('span')
    var clock = setInterval(function() {
        $boomTexts.eq(index).addClass('animated ' + type)
        index++
        if (index >= $boomTexts.length) {
            clearInterval(clock)
        }
    }, 300)
}
Footer.init()
Fm.init()