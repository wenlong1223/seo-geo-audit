/** Doubao Organic GEO ROI calculator. Client-side only; no API calls or external assets. */
export const GEO_ROI_PAGE = String.raw`<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>豆包自然GEO收益测算 · SEO/GEO Audit</title>
<meta name="description" content="豆包自然GEO流量收益测算，支持单店、连锁门店、营收ROI与毛利ROI双口径分析。">
<style>
:root{font-family:Inter,-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",system-ui,sans-serif;color:#eaf0fb;background:#081120;font-synthesis:none;--bg:#081120;--panel:#101e31;--panel2:#13243a;--line:#294158;--muted:#91a8c1;--green:#69e0bd;--blue:#78c5fa;--yellow:#ffcf78;--red:#ff969d}
*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(ellipse at 72% -18%,#17435a 0%,transparent 40%),var(--bg)}
a{color:#83e4d0;text-decoration:none}button,input,select,textarea{font:inherit}button{cursor:pointer}
.shell{max-width:1440px;margin:0 auto;padding:20px 22px 60px}
nav{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:27px}
.brand{font-size:17px;font-weight:850}.brand span{color:#69e0bd}.navlinks{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:#9eb4cb}
.hero{margin:16px 0 22px}.eyebrow{color:#70e4cd;font-size:11px;letter-spacing:2px;font-weight:800}
h1{font-size:clamp(27px,4vw,43px);letter-spacing:-1.3px;margin:8px 0 7px}
.lead{font-size:13px;color:#9cb2ca;line-height:1.85;margin:0;max-width:900px}
.notice{border:1px solid #665039;background:#30271c;color:#f2d5a5;padding:12px 15px;border-radius:11px;font-size:12px;line-height:1.8;margin:17px 0}
.periodbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:16px 0}
.periods{display:flex;gap:7px;flex-wrap:wrap}.periods button,.btn{border:1px solid #36516b;border-radius:9px;padding:9px 13px;background:#14283d;color:#c6d9ed;font-size:12px;font-weight:700}
.periods button.active,.btn.primary{background:linear-gradient(110deg,#52ddbf,#6bb9fa);color:#062230;border-color:transparent}
.period-hint{font-size:11px;color:#8fa7c0}
.layout{display:grid;grid-template-columns:370px minmax(0,1fr);gap:17px;align-items:start}
.panel{background:rgba(16,30,49,.96);border:1px solid var(--line);border-radius:15px;padding:17px;min-width:0;box-shadow:0 12px 35px #0002}
.sidebar{position:sticky;top:12px;max-height:calc(100vh - 24px);overflow:auto}
.panel-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 14px}
.panel-title h2,.section-title{font-size:15px;margin:0;font-weight:800}
.sub{font-size:11px;color:#829bb5}
.group{padding:14px 0;border-top:1px solid #263c52}.group:first-of-type{border-top:0;padding-top:0}
.group h3{font-size:12px;color:#cce0f2;margin:0 0 12px;display:flex;align-items:center;gap:8px}
.num{width:22px;height:22px;border-radius:7px;background:#173b4a;color:#73e6ce;display:grid;place-items:center;font-size:11px}
.field{min-width:0;margin-bottom:10px}.field:last-child{margin-bottom:0}
label{display:block;font-size:11px;color:#a9bfd5;margin-bottom:5px;font-weight:650}
input,select,textarea{width:100%;min-width:0;border:1px solid #36516a;border-radius:8px;padding:9px 10px;background:#0a192a;color:#edf5ff;outline:none;font-size:12px}
input:focus,select:focus,textarea:focus{border-color:#66cdbd;box-shadow:0 0 0 3px #54d8c31a}
input[type=range]{padding:0;accent-color:#60d8c1}
input[type=number]{font-variant-numeric:tabular-nums}
small,.help{display:block;color:#8198b1;font-size:10px;line-height:1.65;margin-top:4px}
.cols2{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.cols3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
.custom{display:none}.custom.show{display:block}
.table-mini{width:100%;border-collapse:collapse;font-size:10px}
.table-mini th{color:#91a9c2;background:#14283d;padding:7px 4px;text-align:left;font-weight:650}
.table-mini td{padding:6px 4px;border-bottom:1px solid #243a50}
.table-mini input{padding:7px 5px;font-size:11px}
.high{color:#ffbf78;font-weight:800}.mid{color:#82c7ff;font-weight:800}.low{color:#a6b7ca;font-weight:800}
.warnline{font-size:10px;color:#ffca80;line-height:1.6;margin-top:7px}
.cost-total{display:flex;justify-content:space-between;gap:10px;padding:11px 12px;background:#142d42;border:1px solid #2c5363;border-radius:9px;color:#8fe4d2;font-size:12px;font-weight:800}
.results{min-width:0;display:grid;gap:15px}
.section-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:13px}
.section-head h2{font-size:15px;margin:0}.section-head p{font-size:10px;color:#8ea5be;margin:4px 0 0}
.kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}
.kpi{background:#12243a;border:1px solid #2b435a;border-radius:11px;padding:13px;min-width:0}
.kpi.current{border-top:3px solid #829bb5}.kpi.target{border-top:3px solid #56d5c0}
.kpi-label{font-size:10px;color:#95abc3;min-height:29px;line-height:1.5}
.kpi-value{font-size:clamp(17px,2vw,24px);font-weight:850;letter-spacing:-.5px;overflow-wrap:anywhere;margin-top:7px;font-variant-numeric:tabular-nums}
.kpi-note{font-size:9px;color:#758da8;margin-top:6px}
.pill{display:inline-block;border-radius:5px;padding:3px 7px;font-size:9px;margin-top:7px;background:#25384c;color:#b7c8d9}
.good{color:#6ee2b8!important}.watch{color:#ffcf78!important}.loss{color:#ff929b!important}.na{color:#8da2b9!important}
.goodbg{background:#153d35;color:#7ce6bf}.watchbg{background:#4b3b24;color:#ffcf78}.lossbg{background:#4b2930;color:#ff9ca3}
.table-scroll{overflow:auto}
.data{width:100%;border-collapse:collapse;min-width:560px;font-size:11px}
.data th{background:#14283d;color:#91a9c2;text-align:right;padding:10px 9px;white-space:nowrap}
.data th:first-child,.data td:first-child{text-align:left}
.data td{padding:9px;border-bottom:1px solid #263c52;text-align:right;color:#c7d7e8;font-variant-numeric:tabular-nums}
.data td:first-child{color:#a9bfd5}.data .focus{color:#8fe4d2;font-weight:800}.data tr:last-child td{border-bottom:0}
.data .total{background:#122a3d;font-weight:800}
.analysis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}
.analysis-card{padding:12px;background:#12243a;border:1px solid #2b435a;border-radius:10px;min-width:0}
.analysis-card span{display:block;color:#91a8c1;font-size:10px;line-height:1.5}
.analysis-card strong{display:block;font-size:18px;margin-top:8px;overflow-wrap:anywhere}
.analysis-card small{font-size:9px}
.sensitivity{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.sliderbox{padding:13px;background:#12243a;border:1px solid #2b435a;border-radius:10px}
.sliderhead{display:flex;justify-content:space-between;gap:10px;font-size:11px;color:#bfd2e4;margin-bottom:9px}
.sliderhead output{color:#6ee2c7;font-weight:850}
.sliderbox input{width:100%}
.sensitivity-result{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:11px;padding:13px;background:#142e42;border:1px solid #2e5664;border-radius:10px}
.sensitivity-result span{display:block;font-size:10px;color:#90a9c1}
.sensitivity-result strong{display:block;font-size:18px;color:#80e5d0;margin-top:3px}
details summary{cursor:pointer;list-style:none;font-size:13px;font-weight:800;color:#d4e4f4}
details summary::-webkit-details-marker{display:none}
details summary:after{content:"＋";float:right;color:#70dcca;font-size:16px}
details[open] summary:after{content:"－"}
.explain{padding-top:12px;color:#9fb4ca;font-size:11px;line-height:1.8}
.explain h4{font-size:11px;color:#d3e4f5;margin:13px 0 4px}
.explain p{margin:5px 0}.explain ul{padding-left:18px;margin:5px 0}
textarea{min-height:85px;resize:vertical;line-height:1.65}
.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.footer{text-align:center;color:#7289a3;font-size:10px;line-height:1.8;margin-top:25px}
@media(max-width:1100px){.layout{grid-template-columns:330px minmax(0,1fr)}.kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.analysis{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:760px){.shell{padding:14px 11px 40px}nav{margin-bottom:18px}.layout{grid-template-columns:1fr}.sidebar{position:static;max-height:none}.kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.sensitivity{grid-template-columns:1fr}.panel{padding:14px}.hero{margin-top:8px}}
@media(max-width:380px){.cols2{gap:6px}.kpi{padding:10px}.kpi-value{font-size:16px}}
</style>
</head>
<body>
<div class="shell">
<nav>
  <div class="brand">◈ SEO/GEO Audit <span>/ 豆包自然GEO收益测算</span></div>
  <div class="navlinks"><a href="/">网站检测</a><a href="/toolkit">Web Toolkit V4</a><a href="/intelligence">行业情报</a><a href="/knowledge">知识引擎</a></div>
</nav>
<header class="hero">
  <div class="eyebrow">DOUBAO ORGANIC GEO · ROI MODEL</div>
  <h1>豆包自然GEO收益测算</h1>
  <p class="lead">围绕豆包自然问答推荐、知识图谱实体召回与本地实体曝光，测算从搜索需求、有效曝光、客资到成交的收益链路。支持单店与连锁门店汇总。</p>
</header>
<div class="notice"><strong>核算边界：</strong>仅计算豆包自然GEO流量，不包含付费竞价、信息流广告、短视频付费投放及其他第三方平台付费推广。所有结果均为基于GEO权重模型推演，非企业后台原始经营数据。模型推演值仅供参考，实际收益受商家承接能力、市场环境、竞品动作等因素影响。</div>
<div class="periodbar">
  <div class="periods" id="periods" role="group" aria-label="核算周期">
    <button type="button" data-days="30">近30天</button><button type="button" data-days="90">季度</button><button type="button" data-days="182">半年</button><button type="button" class="active" data-days="365">全年</button>
  </div>
  <div class="period-hint" id="periodHint">当前按全年12个月核算 · 金额单位：人民币</div>
</div>

<div class="layout">
<aside class="panel sidebar" id="sidebar">
  <div class="panel-title"><h2>核算参数设置</h2><button type="button" class="btn" id="toggleInputs">收起参数 ↑</button></div>
  <div id="inputBody">
    <section class="group">
      <h3><span class="num">01</span> 商家基础信息</h3>
      <div class="field"><label for="industry">所属行业</label><select id="industry">
        <option value="restaurant">餐饮美食</option><option value="training">教育培训</option><option value="auto">汽车服务</option><option value="decoration">装修建材</option><option value="home">家政维修</option><option value="finance">财税法律服务</option><option value="optical">眼镜视光</option><option value="medical">医美健康服务</option><option value="wedding">婚纱摄影</option><option value="lock">开锁安防</option><option value="other" selected>其他行业</option><option value="custom">自定义行业</option>
      </select></div>
      <div class="field custom" id="customIndustryBox"><label for="customIndustry">自定义行业名称</label><input id="customIndustry" maxlength="60" placeholder="请输入行业名称"></div>
      <div class="field"><label for="city">所在城市 / 服务区域</label><input id="city" maxlength="100" placeholder="例如：山东烟台芝罘区"></div>
      <div class="cols2">
        <div class="field"><label for="stores">门店 / 分校数量</label><input id="stores" type="number" min="1" max="10000" value="1"></div>
        <div class="field"><label for="margin">综合毛利率（%）</label><input id="margin" type="number" min="0" max="100" step=".1" value="45"></div>
      </div>
      <div class="field"><label for="risk">风险折损系数（%）</label><input id="risk" type="number" min="0" max="100" step=".1" value="0"><small>用于资质、舆情、区域覆盖和服务承接短板等风险折损，不代表真实发生概率。</small></div>
    </section>

    <section class="group">
      <h3><span class="num">02</span> 搜索词与搜索价值</h3>
      <div class="cols2">
        <div class="field"><label for="totalTerms">目标搜索词总条数</label><input id="totalTerms" type="number" min="0" value="50"></div>
        <div class="field"><label for="commercialTerms">有效商业词数量</label><input id="commercialTerms" type="number" min="0" value="20"></div>
      </div>
      <div class="field"><label for="annualSearch">全年目标词包累计搜索量</label><input id="annualSearch" type="number" min="0" value="12000"><small>填写目标词包全年累计检索量估算；不是商家实际曝光量，也不代表平台官方统计。</small></div>
      <div class="field">
        <label>搜索词价值分级（占比与单次搜索商业价值）</label>
        <table class="table-mini"><thead><tr><th>等级</th><th>词量占比（%）</th><th>价值（元/次）</th></tr></thead><tbody>
          <tr><td class="high">高价值</td><td><input id="highShare" type="number" min="0" max="100" value="20"></td><td><input id="highValue" type="number" min="0" step=".1" value="8"></td></tr>
          <tr><td class="mid">中价值</td><td><input id="midShare" type="number" min="0" max="100" value="50"></td><td><input id="midValue" type="number" min="0" step=".1" value="3"></td></tr>
          <tr><td class="low">低价值</td><td><input id="lowShare" type="number" min="0" max="100" value="30"></td><td><input id="lowValue" type="number" min="0" step=".1" value=".8"></td></tr>
        </tbody></table>
        <div class="warnline" id="shareWarning"></div><div class="warnline" id="termsWarning"></div>
      </div>
      <div class="analysis-card"><span>加权单次搜索商业价值</span><strong id="weightedValue">¥0</strong><small>所选周期搜索总商业价值：<b id="totalSearchValue">¥0</b></small></div>
    </section>

    <section class="group">
      <h3><span class="num">03</span> GEO核心权重因子 · 现状 / 优化目标</h3>
      <table class="table-mini"><thead><tr><th>权重因子</th><th>现状</th><th>优化目标</th></tr></thead><tbody>
        <tr><td>知识图谱覆盖度（分）</td><td><input id="kgCurrent" type="number" min="0" max="100" value="30"></td><td><input id="kgTarget" type="number" min="0" max="100" value="65"></td></tr>
        <tr><td>问答提及率（%）</td><td><input id="mentionCurrent" type="number" min="0" max="100" value="15"></td><td><input id="mentionTarget" type="number" min="0" max="100" value="35"></td></tr>
        <tr><td>问答推荐率（%）</td><td><input id="recommendCurrent" type="number" min="0" max="100" value="15"></td><td><input id="recommendTarget" type="number" min="0" max="100" value="30"></td></tr>
        <tr><td>实体召回曝光率（%）</td><td><input id="recallCurrent" type="number" min="0" max="100" value="12"></td><td><input id="recallTarget" type="number" min="0" max="100" value="25"></td></tr>
      </tbody></table>
      <small>知识图谱覆盖度为0—100分，其余为百分比。知识图谱、提及率与门店数量通过有限修正系数影响实体召回率。</small>
    </section>

    <section class="group">
      <h3><span class="num">04</span> 转化漏斗参数</h3>
      <div class="cols2">
        <div class="field"><label for="clickRate">曝光→有效点击率（%）</label><input id="clickRate" type="number" min="0" max="100" step=".1" value="5"></div>
        <div class="field"><label for="leadRate">点击→有效客资率（%）</label><input id="leadRate" type="number" min="0" max="100" step=".1" value="12"></div>
        <div class="field"><label for="closeRate">客资→成交率（%）</label><input id="closeRate" type="number" min="0" max="100" step=".1" value="15"></div>
        <div class="field"><label for="ticket">单客平均成交营收（元）</label><input id="ticket" type="number" min="0" step=".01" value="1500"></div>
      </div>
      <div class="field"><label for="repeatFactor">老客复购 / 转介绍增益系数</label><input id="repeatFactor" type="number" min="0" max="5" step=".05" value="1"><small>1代表不额外计入；1.2代表在基础成交订单期望值上增加20%的等效收益。</small></div>
    </section>

    <section class="group">
      <h3><span class="num">05</span> GEO优化投入成本</h3>
      <div class="field"><label for="laborCost">运营人力成本（元/年）</label><input id="laborCost" type="number" min="0" value="18000"></div>
      <div class="field"><label for="contentCost">信源素材制作成本（元/年）</label><input id="contentCost" type="number" min="0" value="6000"></div>
      <div class="field"><label for="sourceCost">外部权威背书信源成本（元/年）</label><input id="sourceCost" type="number" min="0" value="3000"></div>
      <div class="field"><label for="toolCost">工具与诊断服务年费（元/年）</label><input id="toolCost" type="number" min="0" value="2400"></div>
      <div class="field"><label for="otherCost">其他GEO专项杂费（元/年）</label><input id="otherCost" type="number" min="0" value="1200"></div>
      <div class="cost-total"><span>全年GEO总投入</span><strong id="annualCost">¥30,600</strong></div>
      <small>按所选周期天数同比例折算。只计自然GEO优化成本，不包含付费流量采购。</small>
    </section>
  </div>
</aside>

<main class="results">
  <section class="panel">
    <div class="section-head"><div><h2>经营收益核心看板</h2><p>现状模型 VS 优化目标模型 · 八项核心指标</p></div><span class="sub" id="periodCost">周期投入：¥30,600</span></div>
    <div class="kpis">
      <article class="kpi current"><div class="kpi-label">现状 · GEO增量营收</div><div class="kpi-value" id="curRevenue">¥0</div><div class="kpi-note">现状权重推演</div></article>
      <article class="kpi target"><div class="kpi-label">优化后 · GEO增量营收</div><div class="kpi-value" id="tarRevenue">¥0</div><div class="kpi-note">目标权重推演</div></article>
      <article class="kpi current"><div class="kpi-label">现状 · GEO增量毛利</div><div class="kpi-value" id="curGross">¥0</div><div class="kpi-note">按综合毛利率计算</div></article>
      <article class="kpi target"><div class="kpi-label">优化后 · GEO增量毛利</div><div class="kpi-value" id="tarGross">¥0</div><div class="kpi-note">按综合毛利率计算</div></article>
      <article class="kpi current"><div class="kpi-label">现状 · 营收ROI</div><div class="kpi-value" id="curRevenueROI">—</div><div class="kpi-note">增量营收 ÷ 周期投入</div><span class="pill" id="curRevenueTag">待核算</span></article>
      <article class="kpi target"><div class="kpi-label">优化后 · 营收ROI</div><div class="kpi-value" id="tarRevenueROI">—</div><div class="kpi-note">增量营收 ÷ 周期投入</div><span class="pill" id="tarRevenueTag">待核算</span></article>
      <article class="kpi current"><div class="kpi-label">现状 · 毛利ROI</div><div class="kpi-value" id="curGrossROI">—</div><div class="kpi-note">增量毛利 ÷ 周期投入</div><span class="pill" id="curGrossTag">待核算</span></article>
      <article class="kpi target"><div class="kpi-label">优化后 · 毛利ROI</div><div class="kpi-value" id="tarGrossROI">—</div><div class="kpi-note">增量毛利 ÷ 周期投入</div><span class="pill" id="tarGrossTag">待核算</span></article>
    </div>
    <p class="sub" style="margin:12px 0 0">ROI以倍数表示，不是净利润率。所有指标均为模型推演值，仅供参考。</p>
  </section>

  <section class="panel">
    <div class="section-head"><div><h2>自然流量转化漏斗</h2><p>从豆包目标词包到有效客资、成交与毛利</p></div></div>
    <div class="table-scroll"><table class="data"><thead><tr><th>指标</th><th>现状模型</th><th>优化目标</th><th>目标－现状</th></tr></thead><tbody id="funnelBody"></tbody></table></div>
  </section>

  <section class="panel">
    <div class="section-head"><div><h2>优化收益差额与获客成本</h2><p>比较目标模型相对现状模型的变化</p></div></div>
    <div class="analysis">
      <div class="analysis-card"><span>模型推演增量营收</span><strong id="revenueDelta">¥0</strong><small>优化目标－现状</small></div>
      <div class="analysis-card"><span>模型推演增量毛利</span><strong id="grossDelta">¥0</strong><small>优化目标－现状</small></div>
      <div class="analysis-card"><span>优化后单条有效客资成本</span><strong id="targetCPL">—</strong><small id="currentCPL">现状：—</small></div>
      <div class="analysis-card"><span>优化后单笔成交获客成本</span><strong id="targetCPA">—</strong><small id="currentCPA">现状：—</small></div>
    </div>
  </section>

  <section class="panel">
    <div class="section-head"><div><h2>核心权重敏感度测算</h2><p>拖动滑块调整优化目标，实时刷新右侧全部ROI和漏斗数据</p></div></div>
    <div class="sensitivity">
      <div class="sliderbox"><div class="sliderhead"><strong>知识图谱覆盖度目标值</strong><output id="kgSliderValue">65分</output></div><input id="kgSlider" type="range" min="0" max="100" value="65"><small>实体资料、业务关系、地址、资质与服务信息完整度。</small></div>
      <div class="sliderbox"><div class="sliderhead"><strong>问答推荐率目标值</strong><output id="recommendSliderValue">30%</output></div><input id="recommendSlider" type="range" min="0" max="100" value="30"><small>目标问题测试中，商家被明确推荐的比例。</small></div>
    </div>
    <div class="sensitivity-result">
      <div><span>敏感度条件下 · 目标毛利ROI</span><strong id="sensitivityROI">—</strong></div>
      <div><span>目标增量营收</span><strong id="sensitivityRevenue">¥0</strong></div>
      <div><span>目标增量毛利</span><strong id="sensitivityGross">¥0</strong></div>
    </div>
  </section>

  <section class="panel">
    <details>
      <summary>核算口径、公式与数据来源说明</summary>
      <div class="explain">
        <h4>1. 核算范围</h4>
        <p>仅核算豆包自然GEO流量，包括知识图谱实体召回、大模型问答提及与推荐、本地实体POI确权带来的自然曝光和线索。严格排除付费竞价、信息流广告、短视频付费投放和第三方平台付费推广。</p>
        <h4>2. 权重因子定义</h4>
        <ul><li>知识图谱覆盖度：商家实体资料、名称、地址、服务、资质及关联关系的完整程度，按0—100分估算。</li><li>问答提及率：固定目标问题抽样中，商家被豆包回答提及的比例。</li><li>问答推荐率：固定目标问题抽样中，商家被豆包明确推荐的比例。</li><li>实体召回曝光率：目标搜索需求中，商家实体获得有效自然曝光的基础比例。</li></ul>
        <h4>3. 召回率修正机制</h4>
        <p>为使知识图谱、问答提及率和门店数量进入模型，先对录入的基础实体召回曝光率进行有限修正，再代入曝光公式：</p>
        <ul><li>知识图谱修正系数 = 0.85 + 知识图谱得分 × 0.003。</li><li>问答提及率修正系数 = 0.90 + 问答提及率 × 0.002。</li><li>门店地域修正系数 = 1 + min(10%, 2.5% × ln(门店数量))。</li><li>修正后实体召回曝光率最高按100%封顶。</li></ul>
        <p>门店数量只作为有限的地域信号修正因子，不直接等同于流量增长。跨城市连锁应按区域分别核算后汇总，避免重复计算同一搜索需求。</p>
        <h4>4. 核心计算公式</h4>
        <ul><li>有效曝光量 = 周期搜索量 × 修正后实体召回曝光率 × 问答推荐率 × (1－风险折损系数)。</li><li>有效点击量 = 有效曝光量 × 曝光转点击率。</li><li>有效客资量 = 有效点击量 × 点击转客资率。</li><li>成交订单量 = 有效客资量 × 客资成交率 × 复购增益系数。</li><li>GEO增量营收 = 成交订单量 × 单客平均成交营收。</li><li>GEO增量毛利 = GEO增量营收 × 综合毛利率。</li></ul>
        <h4>5. 双口径ROI</h4>
        <ul><li>营收ROI = GEO增量营收 ÷ GEO专项投入。</li><li>毛利ROI = GEO增量毛利 ÷ GEO专项投入。</li><li>两项均以倍数展示。例如毛利ROI为1.5倍，表示每投入1元，对应模型推演毛利1.5元；尚未扣除未计入模型的其他经营成本。</li><li>单客资获取成本 = GEO投入 ÷ 有效客资量；单成交获客成本 = GEO投入 ÷ 成交订单量。</li></ul>
        <h4>6. 周期与成本折算</h4>
        <p>近30天、季度、半年和全年按30、90、182、365天比例折算全年搜索量与年度投入。非全年周期为均匀分摊估算，不代表历史实际结果。</p>
        <h4>7. 搜索词商业价值</h4>
        <p>高、中、低价值词占比自动归一化后计算加权单次搜索商业价值及周期搜索总商业价值。搜索商业价值只用于评估词包价值密度，不直接叠加到营收中，避免与成交漏斗重复计算。</p>
        <h4>8. 数据来源性质</h4>
        <p>商家信息及成本由用户录入；搜索量为目标词包调研估算；知识图谱、提及率、推荐率、实体召回率由抽样测试或模型假设提供；转化率、客单价、毛利率优先采用商家历史经营数据。本工具不连接豆包后台，不读取平台原始曝光、推荐或成交数据。</p>
        <h4>9. 风险提示</h4>
        <p>所有结果均为基于GEO权重模型推演，非企业后台原始经营数据。模型推演值仅供参考，实际收益受商家承接能力、市场环境、竞品动作等因素影响。不得将测算结果表述为平台承诺、排名保证或成交保证。</p>
      </div>
    </details>
  </section>

  <section class="panel">
    <div class="section-head"><div><h2>商家补充说明</h2><p>记录特殊经营条件、竞品、舆情与承接能力等信息</p></div></div>
    <textarea id="notes" maxlength="3000" placeholder="例如：门店位于核心商圈；周边存在3家同类竞品；部分服务需要预约；目前门店接待能力有限……"></textarea>
    <div class="actions"><button type="button" class="btn primary" id="copyReport">复制Markdown报告</button><button type="button" class="btn" id="downloadReport">下载Markdown报告</button><button type="button" class="btn" id="reset">恢复默认参数</button></div>
  </section>
</main>
</div>
<footer class="footer">SEO/GEO Audit · Doubao Organic GEO ROI Calculator<br>本工具为模型推演工具，不代表豆包官方数据、推荐概率或收益承诺。数据仅在当前浏览器中计算，不向服务端提交。</footer>
</div>

<script>
(function(){
'use strict';
const $=id=>document.getElementById(id);
let periodDays=365;
const defaults={
 industry:'other',customIndustry:'',city:'',stores:1,margin:45,risk:0,totalTerms:50,commercialTerms:20,annualSearch:12000,
 highShare:20,highValue:8,midShare:50,midValue:3,lowShare:30,lowValue:.8,
 kgCurrent:30,kgTarget:65,mentionCurrent:15,mentionTarget:35,recommendCurrent:15,recommendTarget:30,recallCurrent:12,recallTarget:25,
 clickRate:5,leadRate:12,closeRate:15,ticket:1500,repeatFactor:1,laborCost:18000,contentCost:6000,sourceCost:3000,toolCost:2400,otherCost:1200,notes:''
};
const presets={
 restaurant:{margin:60,click:5,lead:8,close:20,ticket:120},
 training:{margin:55,click:6,lead:12,close:18,ticket:2500},
 auto:{margin:45,click:6,lead:15,close:25,ticket:1200},
 decoration:{margin:30,click:5,lead:18,close:12,ticket:50000},
 home:{margin:40,click:7,lead:20,close:25,ticket:500},
 finance:{margin:65,click:7,lead:18,close:20,ticket:4000},
 optical:{margin:55,click:6,lead:15,close:22,ticket:1200},
 medical:{margin:55,click:4,lead:10,close:12,ticket:5000},
 wedding:{margin:50,click:5,lead:15,close:15,ticket:8000},
 lock:{margin:45,click:8,lead:25,close:30,ticket:300},
 other:{margin:45,click:5,lead:12,close:15,ticket:1500},
 custom:{margin:45,click:5,lead:12,close:15,ticket:1500}
};
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const n=id=>{const v=Number($(id).value);return Number.isFinite(v)?v:0;};
const money=v=>Number.isFinite(v)?'¥'+new Intl.NumberFormat('zh-CN',{maximumFractionDigits:0}).format(v):'—';
const num=(v,d)=>Number.isFinite(v)?new Intl.NumberFormat('zh-CN',{maximumFractionDigits:d===undefined?1:d}).format(v):'—';
const pct=v=>Number.isFinite(v)?(v*100).toFixed(1)+'%':'—';
const multiple=v=>Number.isFinite(v)?v.toFixed(2)+'倍':'—';
const set=(id,v)=>{$(id).textContent=String(v);};
function annualCost(){return ['laborCost','contentCost','sourceCost','toolCost','otherCost'].reduce((s,id)=>s+Math.max(0,n(id)),0);}
function searchStats(){
 const shares=[Math.max(0,n('highShare')),Math.max(0,n('midShare')),Math.max(0,n('lowShare'))];
 const values=[Math.max(0,n('highValue')),Math.max(0,n('midValue')),Math.max(0,n('lowValue'))];
 const total=shares.reduce((a,b)=>a+b,0);
 const weighted=total>0?shares.reduce((s,v,i)=>s+v*values[i],0)/total:0;
 const volume=Math.max(0,n('annualSearch'))*periodDays/365;
 return {shareTotal:total,weighted,totalValue:weighted*volume,volume};
}
function calc(kind){
 const suffix=kind==='target'?'Target':'Current';
 const factor=periodDays/365;
 const stores=Math.max(1,clamp(n('stores'),1,10000));
 const kg=clamp(n('kg'+suffix),0,100);
 const mention=clamp(n('mention'+suffix),0,100);
 const recommend=clamp(n('recommend'+suffix),0,100)/100;
 const baseRecall=clamp(n('recall'+suffix),0,100)/100;
 const risk=clamp(n('risk'),0,100)/100;
 const kgFactor=.85+kg*.003;
 const mentionFactor=.90+mention*.002;
 const storeFactor=1+Math.min(.10,.025*Math.log(stores));
 const adjustedRecall=clamp(baseRecall*kgFactor*mentionFactor*storeFactor,0,1);
 const volume=Math.max(0,n('annualSearch'))*factor;
 const cost=annualCost()*factor;
 const exposure=volume*adjustedRecall*recommend*(1-risk);
 const clicks=exposure*clamp(n('clickRate'),0,100)/100;
 const leads=clicks*clamp(n('leadRate'),0,100)/100;
 const orders=leads*clamp(n('closeRate'),0,100)/100*Math.max(0,clamp(n('repeatFactor'),0,5));
 const revenue=orders*Math.max(0,n('ticket'));
 const gross=revenue*clamp(n('margin'),0,100)/100;
 return {volume,cost,stores,kg,mention,recommend,baseRecall,kgFactor,mentionFactor,storeFactor,adjustedRecall,risk,exposure,clicks,leads,orders,revenue,gross,
 revenueROI:cost>0?revenue/cost:NaN,grossROI:cost>0?gross/cost:NaN,
 cpl:leads>0?cost/leads:NaN,cpa:orders>0?cost/orders:NaN};
}
function roiClass(v){return !Number.isFinite(v)?'na':v>=1.5?'good':v>=1?'watch':'loss';}
function roiTag(v){
 if(!Number.isFinite(v))return ['未定义',''];
 if(v>=1.5)return ['优秀','goodbg'];
 if(v>=1)return ['观察','watchbg'];
 return ['低于投入','lossbg'];
}
function renderKpi(id,value,cls){$(id).textContent=value;$(id).className='kpi-value'+(cls?' '+cls:'');}
function renderTag(id,v){const x=roiTag(v);$(id).textContent=x[0];$(id).className='pill '+x[1];}
function delta(a,b,d){return num(b-a,d===undefined?1:d);}
function renderFunnel(a,b){
 const rows=[
  ['周期目标词包搜索量',num(a.volume),num(b.volume),delta(a.volume,b.volume)],
  ['知识图谱修正系数',num(a.kgFactor,3)+'×',num(b.kgFactor,3)+'×',delta(a.kgFactor,b.kgFactor,3)],
  ['问答提及率修正系数',num(a.mentionFactor,3)+'×',num(b.mentionFactor,3)+'×',delta(a.mentionFactor,b.mentionFactor,3)],
  ['门店地域修正系数',num(a.storeFactor,3)+'×',num(b.storeFactor,3)+'×',delta(a.storeFactor,b.storeFactor,3)],
  ['修正后实体召回曝光率',pct(a.adjustedRecall),pct(b.adjustedRecall),num((b.adjustedRecall-a.adjustedRecall)*100,2)+'个百分点'],
  ['有效曝光量',num(a.exposure),num(b.exposure),delta(a.exposure,b.exposure)],
  ['有效点击量',num(a.clicks),num(b.clicks),delta(a.clicks,b.clicks)],
  ['有效客资量',num(a.leads),num(b.leads),delta(a.leads,b.leads)],
  ['成交订单量（含复购等效）',num(a.orders,2),num(b.orders,2),delta(a.orders,b.orders,2)],
  ['GEO增量营收',money(a.revenue),money(b.revenue),money(b.revenue-a.revenue)],
  ['GEO增量毛利',money(a.gross),money(b.gross),money(b.gross-a.gross)],
  ['周期GEO专项投入',money(a.cost),money(b.cost),money(b.cost-a.cost)],
  ['单客资获取成本',money(a.cpl),money(b.cpl),Number.isFinite(a.cpl)&&Number.isFinite(b.cpl)?money(b.cpl-a.cpl):'—'],
  ['单成交获客成本',money(a.cpa),money(b.cpa),Number.isFinite(a.cpa)&&Number.isFinite(b.cpa)?money(b.cpa-a.cpa):'—']
 ];
 $('funnelBody').innerHTML=rows.map((r,i)=>'<tr'+([9,10,11].includes(i)?' class="total"':'')+'><td>'+r[0]+'</td><td>'+r[1]+'</td><td class="focus">'+r[2]+'</td><td>'+r[3]+'</td></tr>').join('');
}
function render(){
 const a=calc('current'),b=calc('target'),s=searchStats();
 set('weightedValue',money(s.weighted));set('totalSearchValue',money(s.totalValue));
 set('annualCost',money(annualCost()));set('periodCost','周期投入：'+money(b.cost));
 set('periodHint','当前按'+({30:'近30天',90:'季度（90天）',182:'半年（182天）',365:'全年12个月'}[periodDays])+'核算 · 金额单位：人民币');
 $('shareWarning').textContent=Math.abs(s.shareTotal-100)>.01?'价值占比合计 '+num(s.shareTotal)+'%，系统将按当前占比自动归一化。':'价值占比合计100%。';
 $('termsWarning').textContent=n('commercialTerms')>n('totalTerms')?'有效商业词数量大于目标词总条数，请核对输入。':'';
 renderKpi('curRevenue',money(a.revenue));renderKpi('tarRevenue',money(b.revenue));
 renderKpi('curGross',money(a.gross));renderKpi('tarGross',money(b.gross));
 renderKpi('curRevenueROI',multiple(a.revenueROI),roiClass(a.revenueROI));
 renderKpi('tarRevenueROI',multiple(b.revenueROI),roiClass(b.revenueROI));
 renderKpi('curGrossROI',multiple(a.grossROI),roiClass(a.grossROI));
 renderKpi('tarGrossROI',multiple(b.grossROI),roiClass(b.grossROI));
 renderTag('curRevenueTag',a.revenueROI);renderTag('tarRevenueTag',b.revenueROI);
 renderTag('curGrossTag',a.grossROI);renderTag('tarGrossTag',b.grossROI);
 renderFunnel(a,b);
 set('revenueDelta',money(b.revenue-a.revenue));set('grossDelta',money(b.gross-a.gross));
 set('targetCPL',money(b.cpl));set('currentCPL','现状：'+money(a.cpl));
 set('targetCPA',money(b.cpa));set('currentCPA','现状：'+money(a.cpa));
 set('kgSliderValue',n('kgTarget')+'分');set('recommendSliderValue',n('recommendTarget')+'%');
 $('kgSlider').value=String(clamp(n('kgTarget'),0,100));$('recommendSlider').value=String(clamp(n('recommendTarget'),0,100));
 set('sensitivityROI',multiple(b.grossROI));set('sensitivityRevenue',money(b.revenue));set('sensitivityGross',money(b.gross));
 $('sensitivityROI').className=roiClass(b.grossROI);
}
function applyIndustry(){
 const key=$('industry').value,p=presets[key]||presets.other;
 $('customIndustryBox').classList.toggle('show',key==='custom');
 $('margin').value=p.margin;$('clickRate').value=p.click;$('leadRate').value=p.lead;$('closeRate').value=p.close;$('ticket').value=p.ticket;
 render();
}
$('industry').addEventListener('change',applyIndustry);
$('periods').addEventListener('click',e=>{
 const b=e.target.closest('button[data-days]');if(!b)return;
 periodDays=Number(b.dataset.days);
 document.querySelectorAll('#periods button').forEach(x=>x.classList.toggle('active',x===b));
 render();
});
$('kgSlider').addEventListener('input',e=>{$('kgTarget').value=e.target.value;render();});
$('recommendSlider').addEventListener('input',e=>{$('recommendTarget').value=e.target.value;render();});
$('inputBody').addEventListener('input',e=>{
 if(e.target.id==='kgTarget')$('kgSlider').value=String(clamp(n('kgTarget'),0,100));
 if(e.target.id==='recommendTarget')$('recommendSlider').value=String(clamp(n('recommendTarget'),0,100));
 render();
});
$('toggleInputs').addEventListener('click',()=>{
 const body=$('inputBody'),hide=body.hidden;
 body.hidden=!hide;$('toggleInputs').textContent=hide?'收起参数 ↑':'展开参数 ↓';
});
function report(){
 const a=calc('current'),b=calc('target'),s=searchStats();
 const industry=$('industry').value==='custom'?($('customIndustry').value||'自定义行业'):$('industry').selectedOptions[0].textContent;
 const period={30:'近30天',90:'季度',182:'半年',365:'全年'}[periodDays];
 return '# 豆包自然GEO收益核算报告\\n\\n'+
 '- 核算日期：'+new Date().toLocaleDateString('zh-CN')+'\\n'+
 '- 核算周期：'+period+'\\n- 商家行业：'+industry+'\\n- 所在区域：'+($('city').value||'未填写')+'\\n- 门店/分校数量：'+n('stores')+'\\n- 目标搜索词：'+n('totalTerms')+' 条\\n- 有效商业词：'+n('commercialTerms')+' 条\\n\\n'+
 '> **核算范围：仅豆包自然GEO流量。排除付费竞价、信息流广告、短视频付费投放及第三方平台付费推广。所有结果均为基于GEO权重模型推演，非企业后台原始经营数据。模型推演值仅供参考，实际收益受商家承接能力、市场环境、竞品动作等因素影响。**\\n\\n'+
 '## 一、搜索词商业价值\\n\\n| 指标 | 结果 |\\n|---|---:|\\n| 周期搜索量 | '+num(s.volume)+' |\\n| 加权单次搜索商业价值 | '+money(s.weighted)+' |\\n| 周期搜索总商业价值 | '+money(s.totalValue)+' |\\n\\n搜索商业价值仅用于评估词包价值密度，不直接叠加到营收。\\n\\n'+
 '## 二、GEO权重参数\\n\\n| 指标 | 现状 | 优化目标 |\\n|---|---:|---:|\\n| 知识图谱覆盖度 | '+n('kgCurrent')+' 分 | '+n('kgTarget')+' 分 |\\n| 问答提及率 | '+n('mentionCurrent')+'% | '+n('mentionTarget')+'% |\\n| 问答推荐率 | '+n('recommendCurrent')+'% | '+n('recommendTarget')+'% |\\n| 基础实体召回曝光率 | '+n('recallCurrent')+'% | '+n('recallTarget')+'% |\\n| 修正后实体召回曝光率 | '+pct(a.adjustedRecall)+' | '+pct(b.adjustedRecall)+' |\\n\\n'+
 '## 三、转化漏斗\\n\\n| 指标 | 现状 | 优化目标 |\\n|---|---:|---:|\\n| 有效曝光量 | '+num(a.exposure)+' | '+num(b.exposure)+' |\\n| 有效点击量 | '+num(a.clicks)+' | '+num(b.clicks)+' |\\n| 有效客资量 | '+num(a.leads)+' | '+num(b.leads)+' |\\n| 成交订单量（含复购等效） | '+num(a.orders,2)+' | '+num(b.orders,2)+' |\\n| GEO增量营收 | '+money(a.revenue)+' | '+money(b.revenue)+' |\\n| GEO增量毛利 | '+money(a.gross)+' | '+money(b.gross)+' |\\n\\n'+
 '## 四、双口径ROI\\n\\n| 指标 | 现状 | 优化目标 |\\n|---|---:|---:|\\n| 周期GEO投入 | '+money(a.cost)+' | '+money(b.cost)+' |\\n| 营收ROI | '+multiple(a.revenueROI)+' | '+multiple(b.revenueROI)+' |\\n| 毛利ROI | '+multiple(a.grossROI)+' | '+multiple(b.grossROI)+' |\\n| 单客资获取成本 | '+money(a.cpl)+' | '+money(b.cpl)+' |\\n| 单成交获客成本 | '+money(a.cpa)+' | '+money(b.cpa)+' |\\n\\n'+
 '## 五、优化预期差额\\n\\n- 模型推演增量营收：'+money(b.revenue-a.revenue)+'\\n- 模型推演增量毛利：'+money(b.gross-a.gross)+'\\n- 全年GEO投入：'+money(annualCost())+'\\n- 门店地域修正系数：'+a.storeFactor.toFixed(3)+'\\n\\n'+
 '## 六、年度投入构成\\n\\n| 项目 | 年度金额 |\\n|---|---:|\\n| 运营人力 | '+money(n('laborCost'))+' |\\n| 信源素材制作 | '+money(n('contentCost'))+' |\\n| 外部权威信源 | '+money(n('sourceCost'))+' |\\n| 工具与诊断 | '+money(n('toolCost'))+' |\\n| 其他专项费用 | '+money(n('otherCost'))+' |\\n| **年度合计** | **'+money(annualCost())+'** |\\n\\n'+
 '## 七、补充说明\\n\\n'+($('notes').value||'暂无补充说明')+'\\n\\n---\\n\\n本报告为模型推演值，不是企业后台原始经营数据、豆包官方推荐概率或收益承诺。实际收益受商家承接能力、市场环境、竞品动作等因素影响。';
}
async function copyText(text){
 if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);return true;}
 const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();
 let ok=false;try{ok=document.execCommand('copy');}catch(e){ok=false;}area.remove();return ok;
}
$('copyReport').addEventListener('click',async()=>{try{const ok=await copyText(report());alert(ok?'Markdown报告已复制。':'复制失败，请使用下载功能。');}catch(e){alert('复制失败，请使用下载功能。');}});
$('downloadReport').addEventListener('click',()=>{
 const blob=new Blob(['\\uFEFF'+report()],{type:'text/markdown;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='doubao-organic-geo-roi-'+new Date().toISOString().slice(0,10)+'.md';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
});
$('reset').addEventListener('click',()=>{
 if(!confirm('确定恢复全部默认参数吗？'))return;
 Object.keys(defaults).forEach(id=>{if($(id))$(id).value=defaults[id];});
 periodDays=365;document.querySelectorAll('#periods button').forEach(x=>x.classList.toggle('active',x.dataset.days==='365'));
 $('customIndustryBox').classList.remove('show');$('inputBody').hidden=false;$('toggleInputs').textContent='收起参数 ↑';render();
});
render();
})();
</script>
</body>
</html>`;
