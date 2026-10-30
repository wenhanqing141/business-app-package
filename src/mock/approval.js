// 审批助手 Mock（#19：包内入口以固定链接传入包内全部审批应用 ID，数据范围收敛为当前应用包）
// 固定链接示例：/approval-helper?appId=app-2（本包仅一个审批应用：维修费用审批）

const APPROVAL_RECORDS = [
  // 待审批（我待处理）
  { id: 'a-01', type: '维修费用审批', appId: 'app-2', title: '3 号教学楼暖气管道维修费用报销', amount: '¥3,200', applicant: '王建国', currentNode: '后勤管理员审批', createdAt: '2026-09-14 09:20' },
  { id: 'a-02', type: '维修费用审批', appId: 'app-2', title: '学生宿舍 5 栋照明线路更换', amount: '¥1,850', applicant: '刘敏', currentNode: '后勤管理员审批', createdAt: '2026-09-13 15:44' },
  { id: 'a-03', type: '维修费用审批', appId: 'app-2', title: '食堂冷库压缩机维修', amount: '¥6,800', applicant: '赵国庆', currentNode: '后勤管理员审批', createdAt: '2026-09-13 10:02' },
  // 已审批（我已处理）
  { id: 'a-04', type: '维修费用审批', appId: 'app-2', title: '图书馆空调滤网更换', amount: '¥920', applicant: '陈芳', currentNode: '已通过', createdAt: '2026-09-12 14:30', result: '通过', finishedAt: '2026-09-12 16:10' },
  { id: 'a-05', type: '维修费用审批', appId: 'app-2', title: '操场看板螺丝加固', amount: '¥150', applicant: '孙立', currentNode: '已通过', createdAt: '2026-09-11 09:12', result: '通过', finishedAt: '2026-09-11 10:40' },
  { id: 'a-06', type: '维修费用审批', appId: 'app-2', title: '化学实验室通风扇维修', amount: '¥2,300', applicant: '李红', currentNode: '已驳回', createdAt: '2026-09-10 11:25', result: '驳回', finishedAt: '2026-09-10 15:00', reason: '预算不足，转下学期' },
  // 我发起的
  { id: 'a-07', type: '维修费用审批', appId: 'app-2', title: '信息中心机房 UPS 检修', amount: '¥4,500', applicant: '张莉', currentNode: '维修工程师报价中', createdAt: '2026-09-14 11:05' },
  { id: 'a-08', type: '维修费用审批', appId: 'app-2', title: '办公楼门禁系统维修', amount: '¥1,200', applicant: '张莉', currentNode: '已通过', createdAt: '2026-09-09 16:40', result: '通过', finishedAt: '2026-09-10 09:30' }
]

const APPROVAL_TYPES = [
  { id: 't-1', name: '维修费用审批', appId: 'app-2', inPackage: true }
]

export default [
  {
    url: '/api/approval/data',
    method: 'get',
    response: ({ query }) => {
      const box = query.box || 'todo'
      const list = APPROVAL_RECORDS.filter((r) => {
        if (box === 'todo') return r.applicant !== '张莉' && r.currentNode.includes('审批')
        if (box === 'done') return r.result !== undefined
        if (box === 'sent') return r.applicant === '张莉'
        return false
      })
      return {
        code: 0,
        data: {
          list,
          // 固定链接参数收敛说明：包内审批应用 ID 列表
          scope: { appIds: ['app-2'], tip: '数据范围已通过固定链接参数收敛为本应用包内审批应用（appId=app-2）' },
          types: APPROVAL_TYPES
        },
        message: 'ok'
      }
    }
  }
]
