# JAVOneStop 一站JAV V0.8.0
**千里之行, 始于架构**

本工具将致力于提供一个All-in-One的使用环境, 便于用户下载, 整理本地JAV文件和其信息. 

## Features ~~四~~五大功能
### JAV Downloader JAV 下载器
<img src="demo/feature2.gif" width="80%"/>

此工具集成Jav网站-115-Aria2下载于一个界面, 需要正确的115_cookies.json和Aria2设置以正常工作. 简易下载流程如下:
* 在浏览器(chrome)登录至115网页界面, 使用EditThisCookie或类似浏览器插件导出cookie, 存入115_cookies.json
* 选择"想要"选项则会显示磁链下载选项.
* 在下方的列表选择下载按钮, 按下后程序自动将磁链加入115并将下载链接传至Aria2
* 115操作过多的时候会提示错误, 用户需要手动使用配置表单 -> 更新115 Cookies -> 115验证码工具进行验证

具体使用请切换至"JAV下载器教程"文档查看

### Jav Local Manager
用以批量刮削本地Jav视频文件, 亦可重新刮削、移动本地已整理的Jav.
### Rename Tool
<img src="demo/feature1.gif" width="80%"/>

此工具含四个选项: 预览文件夹内容, 预览重命名文件, 重命名文件~~, 刮削JAV信息~~(功能已转移至Jav Local Manager). 注意事项如下:
* 用户指定文件夹请使用系统完整路径, 不要使用相对路径
* 目前文件结构不可更改, 设置为: 用户指定文件夹/Jav发行年份/番号/番号.nfo; 未来版本将开放更改, 但是这个基本是最佳配置
* 此工具只会处理用户指定文件下的文件, 不会尝试处理文件夹内的内容
* 支持AB CD编号, 支持中文字幕后缀
* 如果重命名预览不尽如人意, 用户请手动重命名视频文件
* 目前此工具不会移动没有处理成功的视频文件, 用户需要手动移动到别的文件夹
* 后端有扫描nfo功能, 有经验的用户可以尝试

### Handy Features
目前具有以下功能:
* 上传女优头像至Emby; 优先使用/JavHelper/static/nv文件夹内的对应图片; 后备为warashi网站信息

### Settings
表单式界面, 方便用户更新配置文件. 用户也可以直接更新settings.ini文件.

## Installation 安装使用要求
* 本程序使用8009端口, 必须确保此端口目前可以使用.
* 如果需要使用115-Aria2下载功能, 则需在根目录下新建"115_cookies.json"文件并从浏览器导出cookies, 填入; 而且需要正确地配置Aria2.
* 本程序将在本地创建"jav_manager.db"数据库文件, 如无须重置请不要删除.

下载来自本repository的release. 提供MacOS和Windows版本. 

## Usage

下载后解压缩, 双击文件夹内的run文件运行程序.

工作流程:
* 打开 [http://127.0.0.1:8009/](http://127.0.0.1:8009/) 以访问程序界面.
* 选择 Settings 选项卡, 填入 / 修改需要的选项和参数.
* 选择 Main Tool 选项卡, 填入需要整理的路径, 选择 preview 选项并按下 Execute 按钮.
* 浏览表单下方的表格, 确定路径和文件正确(当前并不会处理子文件夹内部的文件).
* 如果需要进行文件重命名, 进行以下步骤, 否则可以跳过重命名部分.
* 如有需要, 选择 preview_rename 选项并按下 Execute 按钮.
* 浏览表单下方的表格, 确定所有文件都被正确地重命名.
* 选择 preview_rename 选项并按下 Execute 按钮, 观察上方的运行记录, 确保重命名正确.
* 选择 preview 选项并按下 Execute 按钮来刷新下方的表格, 确定路径和文件正确.
* 选择 parse_jav 选项并按下 Execute 按钮, 后台将会爬取 javLibrary 和 arzon 的视频文件信息.
* 观察上方的运行记录, 确保文件被正确地处理.

## 路线图 Road Map
[项目管理](https://github.com/ddd354/JAVOneStop/projects/1)

电报反馈: [link](https://t.me/joinchat/PBVbLRfEaXOVFifI2nz3Kg)
部分code来自:[work1](https://github.com/junerain123/JAV-Scraper-and-Rename-local-files)
## License
[MIT](https://choosealicense.com/licenses/mit/)
