import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';
import { hashPassword } from '../src/lib/auth.js';

const ADMIN_PHONE = '18962574183';
const ADMIN_PASSWORD = 'xl040207';

const MOCK_DATA = {
  notes: [
    {
      title: '高等数学 - 微积分基础',
      contentType: 'pdf' as const,
      content: `微积分是数学的一个分支，主要研究函数的变化率和累积量。它包括微分学和积分学两个部分。

第一章 极限与连续
1.1 极限的定义
极限是微积分的基础概念。当x趋近于a时，函数f(x)的极限记为：
lim(x→a) f(x) = L

1.2 连续函数
如果lim(x→a) f(x) = f(a)，则函数f(x)在点a处连续。

第二章 导数
2.1 导数的定义
导数表示函数在某点的变化率：
f'(x) = lim(h→0) [f(x+h) - f(x)] / h

2.2 常见导数公式
- (x^n)' = n*x^(n-1)
- (sin x)' = cos x
- (cos x)' = -sin x
- (e^x)' = e^x

第三章 积分
3.1 不定积分
∫f(x)dx = F(x) + C，其中F'(x) = f(x)

3.2 定积分
∫[a,b] f(x)dx = F(b) - F(a)

第四章 微分方程
4.1 一阶微分方程
dy/dx = f(x,y)

4.2 可分离变量方程
g(y)dy = f(x)dx`,
      aiSummary: '本笔记涵盖了微积分的核心内容，包括极限、导数、积分和微分方程等重要概念。',
      tags: ['数学', '微积分', '高等数学', '导数', '积分'],
      status: 'completed' as const,
      knowledgePoints: [
        { name: '极限的定义', description: '当x趋近于a时，函数f(x)无限接近某个值L', domain: '数学', type: 'concept', mastery: 85 },
        { name: '连续函数', description: 'lim(x→a) f(x) = f(a)，函数在该点连续', domain: '数学', type: 'concept', mastery: 90 },
        { name: '导数的定义', description: 'f\'(x) = lim(h→0) [f(x+h)-f(x)]/h，变化率', domain: '数学', type: 'concept', mastery: 78 },
        { name: '幂函数求导', description: '(x^n)\' = n*x^(n-1)', domain: '数学', type: 'formula', mastery: 95 },
        { name: '三角函数求导', description: '(sin x)\' = cos x, (cos x)\' = -sin x', domain: '数学', type: 'formula', mastery: 88 },
        { name: '指数函数求导', description: '(e^x)\' = e^x', domain: '数学', type: 'formula', mastery: 92 },
        { name: '不定积分', description: '∫f(x)dx = F(x) + C', domain: '数学', type: 'concept', mastery: 70 },
        { name: '定积分', description: '∫[a,b] f(x)dx = F(b) - F(a)', domain: '数学', type: 'concept', mastery: 65 },
        { name: '一阶微分方程', description: 'dy/dx = f(x,y)', domain: '数学', type: 'concept', mastery: 55 },
        { name: '可分离变量方程', description: 'g(y)dy = f(x)dx，分离变量后积分', domain: '数学', type: 'method', mastery: 50 },
      ],
    },
    {
      title: '英语四级词汇精选',
      contentType: 'docx' as const,
      content: `Unit 1 核心词汇
1. abundant adj. 丰富的，充裕的
   例句：The region has abundant natural resources.
   
2. accomplish v. 完成，实现
   例句：We accomplished our goal ahead of schedule.
   
3. accurate adj. 准确的，精确的
   例句：Please provide accurate information.
   
4. acquire v. 获得，取得
   例句：She acquired a good knowledge of English.
   
5. adapt v. 适应，改编
   例句：He adapted quickly to the new environment.
   
Unit 2 动词辨析
6. affect vs effect
   - affect v. 影响（动词）
   - effect n. 效果（名词）
   
7. ensure vs insure vs assure
   - ensure: 确保
   - insure: 保险
   - assure: 保证，使确信
   
Unit 3 名词词汇
8. benefit n. 利益，好处 v. 有益于
   例句：The new policy benefits everyone.
   
9. challenge n. 挑战 v. 挑战
   例句：This is a great challenge for us.
   
10. opportunity n. 机会
    例句：This is a golden opportunity.
    
Unit 4 形容词词汇
11. essential adj. 必要的，本质的
    例句：Water is essential for life.
    
12. significant adj. 重要的，显著的
    例句：There was a significant improvement.
    
13. available adj. 可获得的，可用的
    例句：Tickets are available now.
    
Unit 5 副词词汇
14. approximately adv. 大约，近似地
    例句：It takes approximately two hours.
    
15. completely adv. 完全地
    例句：I completely understand.`,
      aiSummary: '本笔记包含英语四级考试核心词汇，涵盖动词、名词、形容词、副词等各类词汇及其用法辨析。',
      tags: ['英语', '四级', '词汇', '动词', '名词'],
      status: 'completed' as const,
      knowledgePoints: [
        { name: 'abundant', description: 'adj. 丰富的，充裕的', domain: '英语', type: 'vocabulary', mastery: 80 },
        { name: 'accomplish', description: 'v. 完成，实现', domain: '英语', type: 'vocabulary', mastery: 75 },
        { name: 'accurate', description: 'adj. 准确的，精确的', domain: '英语', type: 'vocabulary', mastery: 85 },
        { name: 'acquire', description: 'v. 获得，取得', domain: '英语', type: 'vocabulary', mastery: 70 },
        { name: 'adapt', description: 'v. 适应，改编', domain: '英语', type: 'vocabulary', mastery: 82 },
        { name: 'affect vs effect', description: 'affect是动词"影响"，effect是名词"效果"', domain: '英语', type: 'vocabulary', mastery: 90 },
        { name: 'ensure vs insure vs assure', description: 'ensure确保，insure保险，assure保证', domain: '英语', type: 'vocabulary', mastery: 88 },
        { name: 'benefit', description: 'n.利益v.有益于', domain: '英语', type: 'vocabulary', mastery: 92 },
        { name: 'challenge', description: 'n./v. 挑战', domain: '英语', type: 'vocabulary', mastery: 85 },
        { name: 'opportunity', description: 'n. 机会', domain: '英语', type: 'vocabulary', mastery: 78 },
        { name: 'essential', description: 'adj. 必要的，本质的', domain: '英语', type: 'vocabulary', mastery: 95 },
        { name: 'significant', description: 'adj. 重要的，显著的', domain: '英语', type: 'vocabulary', mastery: 80 },
        { name: 'available', description: 'adj. 可获得的，可用的', domain: '英语', type: 'vocabulary', mastery: 83 },
        { name: 'approximately', description: 'adv. 大约，近似地', domain: '英语', type: 'vocabulary', mastery: 77 },
        { name: 'completely', description: 'adv. 完全地', domain: '英语', type: 'vocabulary', mastery: 88 },
      ],
    },
    {
      title: '计算机网络基础',
      contentType: 'text' as const,
      content: `第一章 OSI七层模型
1. 物理层（Physical Layer）
   - 传输比特流
   - 设备：网卡、集线器、网线

2. 数据链路层（Data Link Layer）
   - 帧的传输与差错检测
   - MAC地址
   - 设备：交换机

3. 网络层（Network Layer）
   - IP地址
   - 路由选择
   - 设备：路由器

4. 传输层（Transport Layer）
   - TCP/UDP协议
   - 端口号
   - 流量控制与拥塞控制

5. 会话层（Session Layer）
   - 建立、管理、终止会话

6. 表示层（Presentation Layer）
   - 数据加密/解密
   - 数据压缩

7. 应用层（Application Layer）
   - HTTP、FTP、DNS等协议

第二章 TCP/IP协议族
1. TCP协议
   - 面向连接
   - 三次握手建立连接
   - 四次挥手断开连接
   - 可靠传输

2. UDP协议
   - 无连接
   - 不可靠传输
   - 速度快

第三章 HTTP协议
1. HTTP请求方法
   - GET：获取资源
   - POST：提交数据
   - PUT：更新资源
   - DELETE：删除资源

2. HTTP状态码
   - 200 OK：成功
   - 301/302：重定向
   - 404：未找到
   - 500：服务器错误`,
      aiSummary: '本笔记系统讲解了计算机网络基础知识，包括OSI七层模型、TCP/IP协议族和HTTP协议。',
      tags: ['计算机', '网络', 'OSI', 'TCP', 'HTTP'],
      status: 'completed' as const,
      knowledgePoints: [
        { name: 'OSI七层模型', description: '物理层、数据链路层、网络层、传输层、会话层、表示层、应用层', domain: '计算机', type: 'concept', mastery: 70 },
        { name: '物理层', description: '传输比特流，使用网卡、集线器等设备', domain: '计算机', type: 'concept', mastery: 85 },
        { name: '数据链路层', description: '帧的传输与差错检测，MAC地址', domain: '计算机', type: 'concept', mastery: 78 },
        { name: '网络层', description: 'IP地址，路由选择，路由器', domain: '计算机', type: 'concept', mastery: 72 },
        { name: '传输层', description: 'TCP/UDP协议，端口号，流量控制', domain: '计算机', type: 'concept', mastery: 65 },
        { name: 'TCP三次握手', description: 'SYN -> SYN+ACK -> ACK，建立连接', domain: '计算机', type: 'concept', mastery: 60 },
        { name: 'TCP四次挥手', description: 'FIN -> ACK -> FIN -> ACK，断开连接', domain: '计算机', type: 'concept', mastery: 58 },
        { name: 'TCP vs UDP', description: 'TCP面向连接可靠，UDP无连接不可靠但速度快', domain: '计算机', type: 'concept', mastery: 80 },
        { name: 'HTTP请求方法', description: 'GET获取、POST提交、PUT更新、DELETE删除', domain: '计算机', type: 'concept', mastery: 90 },
        { name: 'HTTP状态码', description: '200成功、301/302重定向、404未找到、500服务器错误', domain: '计算机', type: 'concept', mastery: 95 },
      ],
    },
    {
      title: '线性代数知识点汇总',
      contentType: 'pdf' as const,
      content: `第一章 矩阵
1.1 矩阵的定义
由m×n个数排列成的m行n列的矩形数组称为m×n矩阵。

1.2 矩阵运算
- 加法：对应元素相加
- 数乘：每个元素乘以常数
- 乘法：(AB)ij = ΣAik*Bkj

1.3 特殊矩阵
- 单位矩阵I
- 零矩阵O
- 对角矩阵
- 对称矩阵

第二章 行列式
2.1 行列式的定义
n阶行列式是n!项的代数和。

2.2 行列式性质
- 行交换变号
- 某行乘以k，行列式乘以k
- 某行的倍数加到另一行，行列式不变

2.3 行列式计算
- 按行/列展开
- 化为上三角行列式

第三章 向量
3.1 向量的定义
n维向量是n个数组成的有序数组。

3.2 线性相关与无关
若存在不全为0的k1,...,kn使k1a1+...+knan=0，则线性相关。

3.3 向量空间
基、维数、坐标

第四章 特征值与特征向量
4.1 定义
若Ax=λx，则λ是特征值，x是特征向量。

4.2 计算
|A-λI|=0`,
      aiSummary: '本笔记系统整理了线性代数的核心知识点，包括矩阵、行列式、向量和特征值等。',
      tags: ['数学', '线性代数', '矩阵', '行列式', '向量'],
      status: 'completed' as const,
      knowledgePoints: [
        { name: '矩阵的定义', description: 'm×n个数排列成的矩形数组', domain: '数学', type: 'concept', mastery: 85 },
        { name: '矩阵乘法', description: '(AB)ij = ΣAik*Bkj，行乘列', domain: '数学', type: 'formula', mastery: 75 },
        { name: '单位矩阵', description: '对角元素为1，其余为0的矩阵', domain: '数学', type: 'concept', mastery: 90 },
        { name: '行列式定义', description: 'n阶行列式是n!项的代数和', domain: '数学', type: 'concept', mastery: 68 },
        { name: '行列式性质', description: '行交换变号，数乘行则行列式乘k，行加减不变', domain: '数学', type: 'concept', mastery: 72 },
        { name: '线性相关', description: '存在不全为0的系数使线性组合为零向量', domain: '数学', type: 'concept', mastery: 60 },
        { name: '线性无关', description: '只有全零系数使线性组合为零向量', domain: '数学', type: 'concept', mastery: 58 },
        { name: '向量空间', description: '满足加法和数乘封闭的向量集合', domain: '数学', type: 'concept', mastery: 55 },
        { name: '特征值', description: 'Ax=λx中的λ值', domain: '数学', type: 'concept', mastery: 50 },
        { name: '特征向量', description: 'Ax=λx中的非零向量x', domain: '数学', type: 'concept', mastery: 48 },
      ],
    },
    {
      title: '数据结构与算法',
      contentType: 'text' as const,
      content: `第一章 线性表
1.1 顺序表
- 用数组存储
- 随机访问O(1)
- 插入删除O(n)

1.2 链表
- 单链表、双链表、循环链表
- 插入删除O(1)
- 访问O(n)

第二章 栈和队列
2.1 栈
- 后进先出(LIFO)
- 应用：括号匹配、表达式求值、函数调用

2.2 队列
- 先进先出(FIFO)
- 应用：BFS、任务调度

第三章 树
3.1 二叉树
- 满二叉树、完全二叉树
- 遍历：前序、中序、后序、层序

3.2 二叉搜索树(BST)
- 左子树<根<右子树
- 查找、插入、删除O(log n)

3.3 AVL树
- 平衡二叉搜索树
- 任意节点左右子树高度差≤1

第四章 图
4.1 图的表示
- 邻接矩阵
- 邻接表

4.2 图的遍历
- DFS(深度优先)
- BFS(广度优先)

4.3 最短路径
- Dijkstra算法
- Floyd-Warshall算法

第五章 排序算法
5.1 冒泡排序 O(n²)
5.2 插入排序 O(n²)
5.3 快速排序 O(n log n)
5.4 归并排序 O(n log n)
5.5 堆排序 O(n log n)`,
      aiSummary: '本笔记涵盖了数据结构与算法的核心内容，包括线性表、栈队列、树、图和排序算法。',
      tags: ['计算机', '数据结构', '算法', '排序', '树'],
      status: 'completed' as const,
      knowledgePoints: [
        { name: '顺序表', description: '数组存储，随机访问O(1)，插入删除O(n)', domain: '计算机', type: 'concept', mastery: 88 },
        { name: '链表', description: '指针连接，插入删除O(1)，访问O(n)', domain: '计算机', type: 'concept', mastery: 85 },
        { name: '栈', description: '后进先出LIFO，应用：括号匹配、表达式求值', domain: '计算机', type: 'concept', mastery: 92 },
        { name: '队列', description: '先进先出FIFO，应用：BFS、任务调度', domain: '计算机', type: 'concept', mastery: 85 },
        { name: '二叉树遍历', description: '前序、中序、后序、层序遍历', domain: '计算机', type: 'method', mastery: 78 },
        { name: '二叉搜索树', description: '左子树<根<右子树，查找O(log n)', domain: '计算机', type: 'concept', mastery: 70 },
        { name: 'AVL树', description: '平衡二叉搜索树，高度差≤1', domain: '计算机', type: 'concept', mastery: 65 },
        { name: 'DFS', description: '深度优先搜索，递归或栈实现', domain: '计算机', type: 'method', mastery: 80 },
        { name: 'BFS', description: '广度优先搜索，队列实现', domain: '计算机', type: 'method', mastery: 82 },
        { name: 'Dijkstra算法', description: '单源最短路径，贪心策略', domain: '计算机', type: 'method', mastery: 60 },
        { name: '快速排序', description: '分治策略，平均O(n log n)', domain: '计算机', type: 'method', mastery: 75 },
        { name: '归并排序', description: '分治策略，稳定O(n log n)', domain: '计算机', type: 'method', mastery: 72 },
      ],
    },
  ],
};

const CHOICE_QUESTIONS = [
  { knowledgePoint: '极限的定义', question: '当x趋近于a时，函数f(x)的极限记为？', options: ['lim(x→a) f(x)', 'f(a)', 'f\'(a)', '∫f(x)dx'], answer: 'A', explanation: '极限的标准表示法是lim(x→a) f(x)，表示当x趋近于a时函数f(x)的值。' },
  { knowledgePoint: '导数的定义', question: '导数f\'(x)的定义式是什么？', options: ['lim(h→0) [f(x+h)-f(x)]/h', 'f(x+h)-f(x)', 'f(x)*h', '∫f(x)dx'], answer: 'A', explanation: '导数是函数在某点的变化率，定义为当h趋近于0时，[f(x+h)-f(x)]/h的极限。' },
  { knowledgePoint: '幂函数求导', question: '函数f(x)=x³的导数是？', options: ['3x²', '3x', 'x²', '3'], answer: 'A', explanation: '根据幂函数求导公式(x^n)\'=n*x^(n-1)，(x³)\'=3x²。' },
  { knowledgePoint: '三角函数求导', question: '(sin x)\'等于？', options: ['cos x', '-cos x', 'sin x', 'tan x'], answer: 'A', explanation: '正弦函数的导数是余弦函数，即(sin x)\' = cos x。' },
  { knowledgePoint: '指数函数求导', question: '(e^x)\'等于？', options: ['e^x', 'x*e^(x-1)', '1/e^x', 'ln(x)'], answer: 'A', explanation: '指数函数e^x的导数等于它本身，即(e^x)\' = e^x。' },
  { knowledgePoint: 'affect vs effect', question: '"The weather ___ my mood" 应填？', options: ['affects', 'effects', 'effect', 'affect'], answer: 'A', explanation: 'affect是动词"影响"，effect是名词"效果"。这里需要动词，所以填affects。' },
  { knowledgePoint: 'ensure vs insure vs assure', question: '"Please ___ the door is locked" 应填？', options: ['ensure', 'insure', 'assure', 'assures'], answer: 'A', explanation: 'ensure表示"确保"，insure表示"保险"，assure表示"使确信"。这里需要"确保"，所以填ensure。' },
  { knowledgePoint: 'benefit', question: 'benefit作为动词时的意思是？', options: ['有益于', '利益', '好处', '受益人'], answer: 'A', explanation: 'benefit作为名词是"利益、好处"，作为动词是"有益于"。' },
  { knowledgePoint: 'OSI七层模型', question: 'OSI模型中负责端到端可靠传输的是哪一层？', options: ['传输层', '网络层', '数据链路层', '应用层'], answer: 'A', explanation: '传输层负责端到端的可靠传输，包括TCP/UDP协议和端口号。' },
  { knowledgePoint: 'TCP三次握手', question: 'TCP三次握手的顺序是？', options: ['SYN -> SYN+ACK -> ACK', 'ACK -> SYN -> SYN+ACK', 'SYN -> ACK -> SYN+ACK', 'SYN+ACK -> SYN -> ACK'], answer: 'A', explanation: 'TCP三次握手：客户端发送SYN，服务端回复SYN+ACK，客户端发送ACK。' },
  { knowledgePoint: 'HTTP请求方法', question: '用于提交表单数据的HTTP方法是？', options: ['POST', 'GET', 'PUT', 'DELETE'], answer: 'A', explanation: 'POST方法用于向服务器提交数据，GET用于获取数据，PUT用于更新，DELETE用于删除。' },
  { knowledgePoint: 'HTTP状态码', question: '表示资源未找到的状态码是？', options: ['404', '200', '500', '301'], answer: 'A', explanation: '404表示Not Found（未找到），200表示成功，500表示服务器错误，301表示永久重定向。' },
  { knowledgePoint: '矩阵乘法', question: '矩阵A(2×3)和矩阵B(3×4)相乘的结果矩阵维度是？', options: ['2×4', '3×3', '2×3', '3×4'], answer: 'A', explanation: '矩阵乘法要求前一矩阵的列数等于后一矩阵的行数，结果矩阵维度为前一矩阵行数×后一矩阵列数。' },
  { knowledgePoint: '线性相关', question: '若存在不全为0的系数使向量线性组合为零向量，则这些向量是？', options: ['线性相关', '线性无关', '正交', '归一化'], answer: 'A', explanation: '线性相关的定义是存在不全为0的系数使线性组合为零向量。' },
  { knowledgePoint: '栈', question: '栈的特点是？', options: ['后进先出', '先进先出', '随机访问', '有序存储'], answer: 'A', explanation: '栈是LIFO（Last In First Out）结构，即后进先出。' },
  { knowledgePoint: '队列', question: '队列的特点是？', options: ['先进先出', '后进先出', '随机访问', '无序存储'], answer: 'A', explanation: '队列是FIFO（First In First Out）结构，即先进先出。' },
  { knowledgePoint: '二叉树遍历', question: '前序遍历的顺序是？', options: ['根-左-右', '左-根-右', '左-右-根', '层序'], answer: 'A', explanation: '前序遍历先访问根节点，然后左子树，最后右子树。' },
  { knowledgePoint: '快速排序', question: '快速排序的平均时间复杂度是？', options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'], answer: 'A', explanation: '快速排序采用分治策略，平均时间复杂度为O(n log n)。' },
  { knowledgePoint: 'DFS', question: 'DFS（深度优先搜索）通常使用什么数据结构实现？', options: ['栈', '队列', '链表', '数组'], answer: 'A', explanation: 'DFS使用栈（或递归调用栈）来实现，BFS使用队列。' },
  { knowledgePoint: 'BFS', question: 'BFS（广度优先搜索）通常使用什么数据结构实现？', options: ['队列', '栈', '链表', '数组'], answer: 'A', explanation: 'BFS使用队列来实现，按层遍历图或树。' },
];

const FILL_QUESTIONS = [
  { knowledgePoint: '极限的定义', question: '当x趋近于a时，函数f(x)无限接近某个值L，这个值L称为函数f(x)在x=a处的______。', answer: '极限', explanation: '极限是微积分的基础概念，表示函数在某点附近的趋势。' },
  { knowledgePoint: '连续函数', question: '如果lim(x→a) f(x) = f(a)，则函数f(x)在点a处______。', answer: '连续', explanation: '连续函数的定义要求极限值等于函数值。' },
  { knowledgePoint: '不定积分', question: '∫f(x)dx = F(x) + C，其中C称为______。', answer: '积分常数', explanation: '不定积分的结果包含一个任意常数C，称为积分常数。' },
  { knowledgePoint: '定积分', question: '∫[a,b] f(x)dx = F(b) - F(a)，这个公式称为______。', answer: '牛顿-莱布尼茨公式', explanation: '牛顿-莱布尼茨公式是微积分基本定理，将定积分与不定积分联系起来。' },
  { knowledgePoint: '一阶微分方程', question: '形如dy/dx = f(x,y)的方程称为______微分方程。', answer: '一阶', explanation: '微分方程的阶数由最高阶导数决定，dy/dx是一阶导数。' },
  { knowledgePoint: 'abundant', question: 'The region has ______ natural resources.（丰富的）', answer: 'abundant', explanation: 'abundant是形容词，意为"丰富的，充裕的"。' },
  { knowledgePoint: 'accomplish', question: 'We ______ our goal ahead of schedule.（完成）', answer: 'accomplished', explanation: 'accomplish是动词，意为"完成，实现"。这里使用过去式accomplished。' },
  { knowledgePoint: 'essential', question: 'Water is ______ for life.（必要的）', answer: 'essential', explanation: 'essential是形容词，意为"必要的，本质的"。' },
  { knowledgePoint: 'significant', question: 'There was a ______ improvement.（显著的）', answer: 'significant', explanation: 'significant是形容词，意为"重要的，显著的"。' },
  { knowledgePoint: 'OSI七层模型', question: 'OSI模型中，______层负责IP地址和路由选择。', answer: '网络', explanation: '网络层负责IP地址分配和路由选择，使用路由器设备。' },
  { knowledgePoint: 'TCP vs UDP', question: '______协议是面向连接的可靠传输协议。', answer: 'TCP', explanation: 'TCP（传输控制协议）是面向连接的，提供可靠、有序的数据传输。' },
  { knowledgePoint: '数据链路层', question: '______层负责帧的传输和MAC地址处理。', answer: '数据链路', explanation: '数据链路层处理帧的封装、差错检测和MAC地址。' },
  { knowledgePoint: '单位矩阵', question: '对角元素为1，其余元素为0的矩阵称为______。', answer: '单位矩阵', explanation: '单位矩阵I与任何矩阵相乘都等于该矩阵本身。' },
  { knowledgePoint: '行列式性质', question: '交换行列式的两行，行列式值______。', answer: '变号', explanation: '行列式的一个基本性质是交换两行（或两列），行列式值变号。' },
  { knowledgePoint: '线性无关', question: '只有全零系数能使向量线性组合为零向量，则这些向量______。', answer: '线性无关', explanation: '线性无关是线性相关的对立面，要求只有平凡解。' },
  { knowledgePoint: '顺序表', question: '顺序表使用______存储数据，支持随机访问。', answer: '数组', explanation: '顺序表的底层实现是数组，因此可以通过索引直接访问元素。' },
  { knowledgePoint: '链表', question: '链表通过______连接各个节点，插入删除效率高。', answer: '指针', explanation: '链表中的每个节点通过指针指向下一个节点（单链表）或前后节点（双链表）。' },
  { knowledgePoint: '二叉搜索树', question: '二叉搜索树的特点是：左子树所有节点值______根节点值______右子树所有节点值。', answer: '小于，大于', explanation: '二叉搜索树的左子树节点值都小于根节点，右子树节点值都大于根节点。' },
  { knowledgePoint: '归并排序', question: '归并排序是一种______排序算法，时间复杂度为O(n log n)。', answer: '稳定', explanation: '归并排序是稳定排序，相同元素的相对顺序在排序后保持不变。' },
  { knowledgePoint: 'Dijkstra算法', question: 'Dijkstra算法用于求解______最短路径问题。', answer: '单源', explanation: 'Dijkstra算法求解从一个源点到图中所有其他顶点的最短路径。' },
];

async function generateMockData() {
  try {
    let user = await prisma.user.findUnique({ where: { phone: ADMIN_PHONE } });
    
    if (!user) {
      console.log(`创建用户 ${ADMIN_PHONE}...`);
      user = await prisma.user.create({
        data: {
          phone: ADMIN_PHONE,
          password: hashPassword(ADMIN_PASSWORD),
          nickname: '学习达人',
        },
      });
    } else {
      console.log(`用户 ${ADMIN_PHONE} 已存在，ID: ${user.id}`);
    }

    console.log(`\n开始生成测试数据...`);
    
    const createdNotes: any[] = [];
    
    for (const noteData of MOCK_DATA.notes) {
      console.log(`\n创建笔记: ${noteData.title}`);
      
      const note = await prisma.note.create({
        data: {
          title: noteData.title,
          contentType: noteData.contentType,
          content: noteData.content,
          aiSummary: noteData.aiSummary,
          tags: noteData.tags,
          status: noteData.status,
          userId: user.id,
        },
      });
      createdNotes.push(note);

      console.log(`创建知识点 (${noteData.knowledgePoints.length}个)...`);
      const knowledgePoints = await prisma.knowledgePoint.createMany({
        data: noteData.knowledgePoints.map((kp) => ({
          ...kp,
          noteId: note.id,
        })),
      });
      console.log(`知识点创建成功: ${knowledgePoints.count}个`);
    }

    console.log(`\n生成选择题...`);
    const allKnowledgePoints = await prisma.knowledgePoint.findMany({
      where: { note: { userId: user.id } },
    });

    const choiceQuestionsToCreate = [];
    for (const q of CHOICE_QUESTIONS) {
      const kp = allKnowledgePoints.find((kp) => kp.name === q.knowledgePoint);
      if (kp) {
        choiceQuestionsToCreate.push({
          questionType: 'choice',
          answerType: 'single',
          questionText: q.question,
          options: q.options,
          correctAnswer: q.answer,
          explanation: q.explanation,
          domain: kp.domain,
          knowledgePointId: kp.id,
        });
      }
    }

    if (choiceQuestionsToCreate.length > 0) {
      const createdChoiceQuestions = await prisma.question.createMany({
        data: choiceQuestionsToCreate,
      });
      console.log(`选择题创建成功: ${createdChoiceQuestions.count}道`);
    }

    console.log(`\n生成简答题...`);
    const fillQuestionsToCreate = [];
    for (const q of FILL_QUESTIONS) {
      const kp = allKnowledgePoints.find((kp) => kp.name === q.knowledgePoint);
      if (kp) {
        fillQuestionsToCreate.push({
          questionType: 'fill',
          answerType: 'single',
          questionText: q.question,
          options: [],
          correctAnswer: q.answer,
          explanation: q.explanation,
          domain: kp.domain,
          knowledgePointId: kp.id,
        });
      }
    }

    if (fillQuestionsToCreate.length > 0) {
      const createdFillQuestions = await prisma.question.createMany({
        data: fillQuestionsToCreate,
      });
      console.log(`简答题创建成功: ${createdFillQuestions.count}道`);
    }

    console.log(`\n生成答题记录...`);
    const allQuestions = await prisma.question.findMany({
      where: { knowledgePoint: { note: { userId: user.id } } },
    });

    const reviewRecords: any[] = [];
    const now = new Date();
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      
      const dayQuestions = allQuestions.slice(i * 5, (i + 1) * 5);
      
      for (const question of dayQuestions) {
        const isCorrect = Math.random() > 0.3;
        const userAnswer = isCorrect 
          ? question.correctAnswer 
          : question.questionType === 'choice' 
            ? ['A', 'B', 'C', 'D'].filter(a => a !== question.correctAnswer)[Math.floor(Math.random() * 3)]
            : '错误答案';
        
        const time = new Date(day);
        time.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
        
        reviewRecords.push({
          userId: user.id,
          questionId: question.id,
          userAnswer,
          isCorrect,
          createdAt: time,
        });
      }
    }

    if (reviewRecords.length > 0) {
      const createdRecords = await prisma.reviewRecord.createMany({
        data: reviewRecords,
      });
      console.log(`答题记录创建成功: ${createdRecords.count}条`);
    }

    console.log(`\n✅ 测试数据生成完成！`);
    console.log(`📊 统计信息:`);
    console.log(`  - 用户: ${user.nickname} (${user.phone})`);
    console.log(`  - 笔记: ${createdNotes.length}篇`);
    console.log(`  - 知识点: ${allKnowledgePoints.length}个`);
    console.log(`  - 选择题: ${choiceQuestionsToCreate.length}道`);
    console.log(`  - 简答题: ${fillQuestionsToCreate.length}道`);
    console.log(`  - 答题记录: ${reviewRecords.length}条`);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ 生成测试数据失败:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

generateMockData();