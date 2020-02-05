# JAVHelper V0.3.0

本工具将致力于提供一个All-in-One的使用环境, 便于用户整理本地JAV文件. 

部分code来自:[work1](https://github.com/junerain123/JAV-Scraper-and-Rename-local-files)

## Installation

下载来自本repository的release. 提供MacOS和Windows版本. 本程序使用5000端口, 必须确保此端口目前可以使用.

## Usage

下载后解压缩, 双击文件夹内的run文件运行程序.

工作流程:
* 打开 [http://127.0.0.1:5000/](http://127.0.0.1:5000/) 以访问程序界面.
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


## License
[MIT](https://choosealicense.com/licenses/mit/)
