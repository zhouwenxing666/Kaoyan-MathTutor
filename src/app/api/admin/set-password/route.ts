import { NextRequest } from 'next/server'
import { execSync } from 'child_process'

const MANAGEMENT_API = 'https://api.supabase.com/v1'
const MANAGEMENT_TOKEN = 'sbp_1a13c89fc4fa1cac4daecfc190dbfd6cf8c39a45'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkcmpzbWh4ZG5yaHlreGdjaGVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzkwNzQ0NywiZXhwIjoyMDg5NDgzNDQ3fQ.Wsp-DdgNvYw2KQCK8PQfENi5FAKpPLlLsaIPsgU5284'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return Response.json({ error: '缺少邮箱或密码' }, { status: 400 })
    }
    
    // 1. 通过 Management API 获取用户 ID
    const listResult = execSync(
      `curl -s -X POST "${MANAGEMENT_API}/projects/fdrjsmhxdnrhykxgchep/database/query" \
        -H "Authorization: Bearer ${MANAGEMENT_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{"query": "SELECT id FROM auth.users WHERE email = '\\''${email}'\\''"}'`,
      { encoding: 'utf8' }
    )
    
    const userData = JSON.parse(listResult)
    if (!userData[0]?.id) {
      return Response.json({ error: '用户不存在' }, { status: 404 })
    }
    
    const userId = userData[0].id
    
    // 2. 使用 curl 更新密码（GoTrue API 需要 curl）
    const updateResult = execSync(
      `curl -s -X PUT "https://fdrjsmhxdnrhykxgchep.supabase.co/auth/v1/admin/users/${userId}" \
        -H "Authorization: Bearer ${SERVICE_KEY}" \
        -H "apikey: ${SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -H "User-Agent: curl/7.88.1" \
        -d '{"password":"${password}"}'}`,
      { encoding: 'utf8' }
    )
    
    const updateResponse = JSON.parse(updateResult)
    
    if (updateResponse.error || updateResponse.msg) {
      return Response.json({ error: updateResponse.msg || updateResponse.error }, { status: 500 })
    }
    
    return Response.json({ 
      success: true, 
      message: '密码设置成功！现在可以使用密码登录',
      email: email 
    })
    
  } catch (error: any) {
    console.error('Error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
