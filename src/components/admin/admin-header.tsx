import React from 'react'
import { TabsList, TabsTrigger } from '../ui/tabs'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge';

interface AdminHeaderProps {
  count: {
    pendingRequests: number;
    allInterns: number;
    supervisorRelationships: number;
    approvals: number;
  }
}
export default function AdminHeader({ count }: AdminHeaderProps) {
  const activeStyle = 'data-[state=active]:bg-accent data-[state=active]:text-white'
  return (
    <div className='px-6 border-b bg-white flex items-center justify-between shadow-md'>
        <div className=''>
            <TabsList className="space-x-4 shadow-sm border">
                <TabsTrigger value="pending-requests" className={activeStyle}>
                  Pending Requests <Badge className='ml-1 bg-red-100 text-red-800'>{count.pendingRequests}</Badge>
                </TabsTrigger>
                <TabsTrigger value="all-interns" className={activeStyle}>
                  All Interns <Badge className='ml-1 bg-blue-100 text-blue-800'>{count.allInterns}</Badge>
                </TabsTrigger>
                <TabsTrigger value="supervisor-relationships" className={activeStyle}>
                  Supervisor Relationships <Badge className='ml-1 bg-green-100 text-green-800'>{count.supervisorRelationships}</Badge>
                </TabsTrigger>
                <TabsTrigger value="approvals" className={activeStyle}>
                  Approvals <Badge className='ml-1 bg-yellow-100 text-yellow-800'>{count.approvals}</Badge>
                </TabsTrigger>
            </TabsList>
        </div>

        <div className='space-x-2 mr-4 py-2'>
            <Button>New Request</Button>
            <Button>New Request</Button>
            <Button>New Request</Button>
        </div>
    </div>
  )
}
