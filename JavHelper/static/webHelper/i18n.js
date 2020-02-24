import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// the translations
// (tip move them in a JSON file and import them)
const resources = {
  en: {
    translation: {
      "Main Tool": "Main Tool",
      "JavLibrary Manager": "JavLibrary Manager",
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
      "file_path_tip": "Default file path in the main tool",
      "emby_addr_tip": "Need to enter full address and port; Example: http://localhost:8096/",
      "Local Config": "Local Config",
      "115 Cookies Update": "115 Cookies Update",
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
      'Rename Tool': 'Rename Tool'
    }
  },
  //{t('')}
  //t('')
  cn: {
    translation: {
      "Main Tool": "刮削工具",
      "JavLibrary Manager": "JavLibrary下载器",
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
      "file_path_tip": "刮削工具默认处理的路径",
      "emby_addr_tip": "填写完整的地址和端口, 例子: http://localhost:8096/",
      "Local Config": "本地配置",
      "115 Cookies Update": "更新115 Cookies",
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
      'Rename Tool': '重命名工具'
    }
  }
};



i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: "cn",

    keySeparator: false, // we do not use keys in form messages.welcome

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

  export default i18n;