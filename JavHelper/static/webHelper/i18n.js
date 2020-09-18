import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// the translations
// (tip move them in a JSON file and import them)
const resources = {
  en: {
    translation: {
      "Main Tool": "Main Tool",
      "JavLibrary Manager": "JAV Downloader",
      "Handy Features": "Handy Features",
      "Settings": "Settings",
      "Preview File / Execute": "Preview File / Execute",
      "Upload actress images to Emby": "Upload actress images to Emby",
      "form_file_path_title": "File Path",
      "form_action_title": "parse files: ",
      "form_file_path_des": "Type in path (Due to restriction of the front end, user has to manually input directory)",
      "form_action_des": "preview - preview folder content only; preview_rename: preview renamed files; rename - perform actual rename; parse_jav: scrape jav video infos",
      "set_file_path_title": "File path",
      "set_enable_proxy_title": "Enable Proxy or Not",
      "set_proxy_addr_port_title": "Proxy address and port",
      "set_emby_addr_port_title": "Emby Server Address and Port",
      "set_javlib_url_title": "Url for Accessing JavLibrary",
      "set_aria2_url_title": "Url for Aria2; Example: http://192.168.1.9",
      "set_aria2_port_title": "Port for Aria2",
      "set_remove_string": "Remove following strings (comma separated)",
      "set_ikoa_dmmc_server": "Server addresses for ikoa dmmc, example: http://192.168.1.2:990/",
      "file_path_tip": "Default file path in the main tool",
      "emby_addr_tip": "Need to enter full address and port; Example: http://localhost:8096/",
      "Local Config": "Local Config",
      "115 Cookies Update": "115 Cookies Update",
      "javlibrary cloudflare cookies": "javlibrary cloudflare cookies",
      "handle_multi_cds": "Handle A/B CD filenames",
      "subtitle_filename_postfix": "Postfixes for subtitled videos; separated by comma",
      "preserve_subtitle_filename": "Handle subtitlted video filenames",
      "most_wanted": "most wanted",
      "best_rated": "best rated",
      "trending_updates": "trending javs",
      "Search Type": "Search Type",
      "Content": "Content",
      'Submit': 'Submit',
      'wanted': "wanted",
      'viewed': 'viewed',
      'no opinion': 'no opinion',
      'local': 'local',
      'downloading': 'downloading',
      'personal_wanted': 'still wanted',
      'search_car_allow_partial': 'Search car (allow partial search)',

      // doc page
      'changelog': 'Change Log',

      // jav browser
      'still_wanted': 'Wanted', 
      'still_downloading': 'Downloading', 
      'iceboxed': 'Iceboxed',

      //rename part
      'Rename Tool': 'Rename Tool',
      'preview_rename_all': 'Preview Rename All',
      'rename_all': 'Rename All',
      'preview_rename': 'Preview Rename',
      'rename': 'Rename',
      'force_rename': 'Force Rename',
      'exit_rename': 'No Rename',

      // local manager
      'refresh_db_fail': 'refresh db failed!',
      'update_scan_path': 'Succeessful updated scan path: ',
      'update_scan_path_fail': 'Update scan path failed',
      'rename_fail_msg': 'Rename file failed',
      'start_batch_srape': 'start batch scrape',
      'search_db': 'searching db',
      'search_db_fail': 'search db failed',
      'preview_name_fail': 'load preview rename failed!',
      'good_scrape': 'Scraped ',
      'fail_scrape': 'single scrape error: ',
      'nfo_write_info': 'NFO write Info',
      'image_write_ok': 'image rewrite succeessful',
      'nfo_write_ok': 'nfo rewrite succeessful',

      // configurator
      'db_type': 'DB Type',

      'scrape_all': 'Scrape All',
      'local': 'Local',
      'not_organized': 'Not Organized',
      'migrate_jav': "Migrate Jav",
      'rewrite_nfo': "Rewrite Nfo",
      'single_scrape': "Single Scrape",
      'rewrite_images': "Rewrite Images",
      'refresh_db': "Refresh DB",
      'javtab_field': 'Field',
      'javtab_value': 'Value',
      'javtab_action': 'Action',
      'filetable_title': 'File List',
      'display_language': 'Tool Language',
      'subtitled': 'subtitled',
      'no_fitler': 'No Filter',
      'w_or_noop': 'Wanted / No Opinion',
      'set_jav_obj_priority': 'Set Jav website sources priority (comma separated)',
      'validate_oof_tool': 'Validate 115',
      'close': 'Close',
      'oof_validate_instruction': 'click following captha and hit submit to validate 115 adding magnet tool',
      'helper_page': 'Help Doc',
      'log_page_incremental': 'current page_num: ',
      'load_detail_image_tab_name': "Load Detail Images",
      'download_magnet_button': 'Download',
      'download_web_button': 'Web Download',
      'download_iframe_button': 'Downloader',
      'log_search_web_jav': 'Searching: ',
      'log_switch_jav_set': 'Change jav set to: ',
      'log_error': 'Error: ',
      'log_change_website': 'change website source to: ',
      'log_aria2_download': 'aria2 downloadeding: ',
      'log_idmm_download': 'idmm downloader job added: ',
      'log_update_jav_stat': 'Update DB Stat: ',
      'log_filter': 'filter on: ',
      'filter_map': JSON.stringify({'w_or_noop': 'wanted / no opnion', 'no_filter': 'none'}),
      'jav_stat_map': JSON.stringify({0: 'want', 1: 'viewed', 2: 'no opinion', 3: 'local', 4: 'downloading', 5: 'iceboxed'}),
      'main_readme': 'Main ReadMe',
      'javdownloader_readme': 'Jav Downloader Tutorial',
      'overall': 'overall',
      'load_more': 'load more',
      'scroll_end': 'this is the end',
      'daily_rank': 'Daily Ranking',
      'weekly_rank': 'Weekly Ranking',
      'monthly_rank': 'Monthly Ranking'
    }
  },
  //{t('')}
  //t('')
  cn: {
    translation: {
      "Main Tool": "刮削工具",
      "JavLibrary Manager": "JAV下载器",
      "Handy Features": "小工具",
      "Settings": "配置表单",
      "Preview File / Execute": "预览/执行",
      "Upload actress images to Emby": "Emby-上传女优头像",
      "form_file_path_title": "文件路径",
      "form_action_des": "preview - 只预览文件夹内容; preview_rename: 预览重命名前后的文件名; rename - 重命名文件; parse_jav: 刮削Jav信息",
      "form_action_title": "选择以下动作: ",
      "form_file_path_des": "输入完整路径 (受前端浏览器安全限制, 用户必须手动输入完整路径)",
      "set_file_path_title": "文件路径",
      "set_enable_proxy_title": "是否启用代理",
      "set_proxy_addr_port_title": "代理 的地址和端口",
      "set_emby_addr_port_title": "Emby服务器的地址和端口",
      "set_javlib_url_title": "JavLibrary可用网址",
      "set_aria2_url_title": "Aria2网址 例如: http://192.168.1.9",
      "set_aria2_port_title": "Aria2端口",
      "set_remove_string": "文件名移除以下字符(英文逗号隔开)",
      "set_ikoa_dmmc_server": "ikoa/dmmc下载服务器地址, 例子: http://192.168.1.2:990/",
      "file_path_tip": "刮削工具默认处理的路径",
      "emby_addr_tip": "填写完整的地址和端口, 例子: http://localhost:8096/",
      "Local Config": "本地配置",
      "115 Cookies Update": "更新115 Cookies",
      "javlibrary cloudflare cookies": "更新Javlibrary cloudflare cookies",
      "handle_multi_cds": "处理A/B CD 后缀文件名",
      "subtitle_filename_postfix": "指定带字幕文件的后缀; 逗号隔开",
      "preserve_subtitle_filename": "处理字幕文件后缀",
      "most_wanted": "最想要",
      "best_rated": "高评价",
      "trending_updates": "新话题",
      "Search Type": "搜索类别",
      "Content": "搜索字符",
      'Submit': '提交',
      'wanted': '想要',
      'viewed': '已阅',
      'no opinion': '没想法',
      'local': '本地有',
      'downloading': '下载中',
      'personal_wanted': '还未下载',
      'search_car_allow_partial': '搜索番号(支持部分搜索)',

      // doc page
      'changelog': '更新日志',

      // jav browser
      'still_wanted': '想要的', 
      'still_downloading': '下载中', 
      'iceboxed': '冷冻箱',

      // rename part
      'Rename Tool': '重命名工具',
      'preview_rename_all': '预览重命名所有',
      'rename_all': '重命名所有',
      'preview_rename': '预览重命名',
      'rename': '重命名',
      'force_rename': '手动重命名',
      'exit_rename': '不重命名',

      // scrape part
      'scrape_all': '刮削整理所有',
      'single_scrape': "刮削整理当前",
      'refresh_db': "刷新数据库刮削信息",

      // local manager
      'refresh_db_fail': '刷新数据库失败',
      'update_scan_path': '成功更新扫描路径: ',
      'update_scan_path_fail': '更新路径失败',
      'rename_fail_msg': '重命名文件失败',
      'start_batch_srape': '开始批量刮削',
      'search_db': '数据库搜索中',
      'search_db_fail': '数据库搜索失败',
      'preview_name_fail': '预览重命名失败',
      'good_scrape': '刮削完成 ',
      'fail_scrape': '刮削失败: ',
      'nfo_write_info': 'NFO写入值',
      'image_write_ok': '成功写入图片',
      'nfo_write_ok': '成功写入nfo文件',

      // configurator
      'db_type': '数据库类型',


      'local': '本地',
      'not_organized': '未整理',
      'migrate_jav': "移动文件",
      'rewrite_nfo': "重写Nfo",
      'rewrite_images': "重写图片",
      'javtab_field': '键',
      'javtab_value': '数据',
      'javtab_action': '执行命令',
      'filetable_title': '文件列表',
      'display_language': '工具语言',
      'subtitled': '中文字幕',
      'no_fitler': '不过滤',
      'w_or_noop': '想要/没想法',
      'set_jav_obj_priority': '设置JAV网站优先级(使用英文逗号隔开)',
      'validate_oof_tool': '115验证码工具',
      'close': '关闭',
      'oof_validate_instruction': '通过以下115验证码检测（正确并不会有跳转，直接关闭工具）',
      'helper_page': '帮助手册',
      'log_page_incremental': '读取页码: ',
      'load_detail_image_tab_name': "加载详细海报",
      'download_magnet_button': '下载',
      'download_web_button': '网页下载',
      'download_iframe_button': '下载器',
      'log_search_web_jav': '搜索: ',
      'log_switch_jav_set': '更改搜索页面: ',
      'log_error': '发生错误: ',
      'log_change_website': '更换网站来源: ',
      'log_aria2_download': '下载添加至aria2: ',
      'log_idmm_download': '下载添加至idmm下载器',
      'log_update_jav_stat': '更新数据库文档: ',
      'log_filter': '启用过滤器: ',
      'filter_map': JSON.stringify({'w_or_noop': '想要/没想法', 'no_filter': '无'}),
      'jav_stat_map': JSON.stringify({0: '想要', 1: '已阅', 2: '没想法', 3: '本地', 4: '下载中', 5: '冷冻箱'}),
      'main_readme': '快速入门介绍',
      'javdownloader_readme': 'JAV下载器教程',
      'overall': '综合',
      'load_more': '加载更多',
      'scroll_end': '没有更多',
      'daily_rank': '日排行',
      'weekly_rank': '周排行',
      'monthly_rank': '月排行'
    }
  }
};



i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: "cn",
    fallbackLng: "cn",

    keySeparator: false, // we do not use keys in form messages.welcome

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

  export default i18n;