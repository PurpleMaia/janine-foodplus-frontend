import React from 'react'
import { TabsList, TabsTrigger } from '../ui/tabs'
import { Button } from '../ui/button'

export default function AdminHeader() {
  const activeStyle = 'data-[state=active]:bg-accent data-[state=active]:text-white'
  return (
    <div className='border-b bg-white flex items-center justify-between'>
        <div className='ml-4'>
            <TabsList className="space-x-4 shadow-sm border">
                <TabsTrigger value="pending-requests" className={activeStyle}>Pending Requests</TabsTrigger>
                <TabsTrigger value="all-interns" className={activeStyle}>All Interns</TabsTrigger>
                <TabsTrigger value="supervisor-relationships" className={activeStyle}>Supervisor Relationships</TabsTrigger>
                <TabsTrigger value="approvals" className={activeStyle}>Approvals</TabsTrigger>
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
