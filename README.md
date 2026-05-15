# Amiibo图鉴

Switch 热门游戏 amiibo 查询工具站。覆盖 13 款游戏，支持按游戏、角色、奖励筛选。

## 怎么打开

直接双击 `index.html` 即可在浏览器里查看。

如果你想用本地网址预览，也可以在这个文件夹里启动一个静态服务，然后打开：

```text
http://localhost:4173
```

## 支持游戏

### P1（较完整数据）

- **王国之泪**（TOTK）— 32+ 条 amiibo 数据，布料/装备/材料全覆盖
- **旷野之息**（BOTW）— 英杰/狼林克/守护者等 5+ 条
- **动物森友会**（ACNH）— 村民邀请、三丽鸥联动、联动 amiibo 5+ 条
- **斯普拉遁 3**（Splatoon 3）— 鱿鱼姐妹/Off the Hook/Deep Cut 等 6+ 条
- **火焰纹章 Engage** — 纹章士戒指、服装票、音乐票 5+ 条
- **马力欧奥德赛**（SMO）— 婚礼服装三件套、月亮提示 4+ 条

### P2（代表性数据 + 来源 + 置信度）

- **马力欧赛车 8 豪华版**（MK8DX）— Mii 赛车手服装
- **任天堂明星大乱斗 特别版**（SSBU）— FP 战斗 AI
- **星之卡比 探索发现** — 材料/星星碎片
- **密特罗德 生存恐惧** — 生命/导弹/隐藏道具
- **怪物猎人 Rise** — 专属 amiibo 防具外观
- **异度神剑 3** — 修尔克/焰光外观
- **上古卷轴 5：天际** — 塞尔达联动装备

## 功能

- 游戏卡片切换 — 首页游戏卡片区，点击切换当前游戏
- amiibo 查奖励 — 按角色/系列/奖励筛选
- 奖励反查 amiibo — 覆盖全部游戏奖励
- 系列筛选 / 标签筛选 / 掉落等级筛选
- 搜索支持游戏名、amiibo 名、奖励名
- 置信度标记 — medium/low 数据标注来源可信度
- SEO 标题和描述覆盖多款游戏

## 数据结构

- `data/amiibo-data.js` — 王国之泪核心数据（第一版保留不变）
- `data/games-data.js` — 多游戏结构数据（13 款游戏）
- `assets/images/games/*.svg` — 游戏封面图
- `assets/images/amiibo/*.png` — amiibo 图片

## 数据核验

最后核验日期：2026-05-15。

- 王国之泪数据：high confidence，多来源交叉核验
- P1 游戏数据：high confidence，参考 Nintendo 官方 + 权威攻略站
- P2 游戏数据：medium confidence，代表条目 + 可追溯来源
- 不确定项均标注 `confidence: "medium"` 或 `"low"`

## 部署前 SEO

已完成以下 SEO 优化：

- **meta 标签**：优化了 `<title>`、`<meta description>`、`<meta keywords>`，覆盖核心关键词（amiibo 图鉴、王国之泪 amiibo 掉落查询、amiibo 怎么用等）
- **Open Graph**：添加了 `og:title`、`og:description`、`og:type`、`og:image`
- **Twitter Card**：添加了 `twitter:card`、`twitter:title`、`twitter:description`
- **JSON-LD 结构化数据**：包含 `WebSite`、`WebApplication`、`FAQPage`（7 个常见问题）、`ItemList`（13 款游戏列表）
- **FAQ 静态内容区**：在页面中添加了覆盖范围、掉落说明、用途对比、后续计划等 SEO 友好的静态文本
- **sitemap.xml**：已创建，包含首页和各锚点页面
- **robots.txt**：已创建，允许搜索引擎抓取
- **图片 alt**：游戏封面和 amiibo 图片均已包含有意义的描述文本

### 部署后待办

1. **替换 sitemap.xml 域名**：将 `https://example.com` 替换为正式域名
2. **提交搜索引擎**：
   - [Google Search Console](https://search.google.com/search-console)
   - [Bing Webmaster Tools](https://www.bing.com/webmasters)
   - [百度搜索资源平台](https://ziyuan.baidu.com/)
3. 验证 robots.txt 和 sitemap.xml 可通过域名正常访问

## 后续计划

1. 补全 P2 游戏的完整 amiibo 数据
2. 补充游戏封面 SVG 和 amiibo 图片
3. 接入英文数据
4. 部署到 GitHub Pages / Cloudflare Pages
5. 接入广告联盟
