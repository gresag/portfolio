import React, {useState, useEffect} from 'react'

import{
    Button, 
    Modal, 
    Tooltip, 
    Upload, 
    List, 
    message,
    notification,
    Tabs, 
    Select, 
    Topography,
} from 'antd'

import './AddAttachment.css'

import{
    UploadOutlined,
    InboxOutlined, 
    DownloadOutlined,
    DeleteOutlined,
} from '@ant-design/icons'

import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { SHA256, lib} from 'crypto-js'

const {Dragger} = Upload

const AddAttachment = ({requestId, askOffers, tableName, reload, record}) => {

    const [showModal, setshowModal] = useState(false)
    const [files, setFiles] = useState([])
    const [selectedAskOffers, setSelectedAskOffers] = useState([])
    const [uploadedFiles, setUploadedFiles] = useState([])
    const [fileList, setFileList] = useState([])
    const [isDownloadingFiles, setIsDownloadingFiles] = useState(false)

    const[selectedOptions, setSelectedOptions] = useState([])

    const handleSelectChange = (selected) => {
        setSelectedOptions(selected)
    }

    const columns = [
        {
            title: 'Parts',
            dataIndex: 'part_id_client', 
        }
    ]

    useEffect(() => {
        setUploadedFiles(files)
    }, [files])

    useEffect(() => {
        const storedFiles = JSON.parse(localStorage.getItem('uploadedFiles')) || []
    }, [])

    const saveFilesToStorage = (files) => {
        localStorage.setItem('uploadFiles', JSON.stringify(files))
    }
      
    const uploadFile = useMutation({
        mutatationKey: 'uploadFiles', 

        mutationFn: (data) => {
            const url = process.env.REACT_APP_PROJECT +'/request/add_file'
            return axios.post(url, data)
        }, 
        onError: (result) => {
            console.error(result.response.data)
            notification.error({message: result.message})
        }
        onSuccess: (result) => {
            notification.success({
                message: '${files?.length > 0? 'File': 'Files'} has been uploaded!'
            })
            setFiles([])
            saveFilesToStorage([])
            reload()
        }
    })

    const handleBeforeUpload = async (info, fileList) => {
        let items = await processFiles(fileList)

        if(askOffers.length > 0){
            setFiles(items)
            setshowModal(true)
        }else{
            uploadedFiles(items)
        }

        return false
    }

    const processFiles = async (fileList) => {
        const promises = Array.from(fileList).map((file) =>{
            const reader = new FileReader()
            reader.readAsArrayBuffer(file)

            reader.onload = (e) => {
                const bufferArray = e.target.result
                const wordArray = lib.WordArray.create(bufferArray)
                const hash = SHA256(wordArray).toString()

                resolve({
                    file, 
                    dict: {
                        name: file.name,
                        size: file.size, 
                        type: file.type,
                        checksum: hash,
                    }
                })
            }

            reader.onerror = (error) => {
                PromiseRejectionEvent(error)
            }
        })
        
        return Promise.all(promises)
    }

    const uploadFiles = (items) => {
        const fromData = new FortmData() 
        items.forEach(({file, dict}) => {
            FormData.append('files', file)
            FormData.append('dict', JSON.stringify(dict))
        })

        formData.append('id', requestId)
        formData.append('table', tableName)
        formData.append('askOffers', selectedAskOffers)

        uploadFile.mutate(formData)
    }

    const handleModalCancel = () =>{
        setFiles([])
        saveFilesToStorage([])
        setshowModal([])
    }

    const handleModalOk = () => {
        uploadedFiles(files)
        setshowModal(false)
    }

    const openCustomModal = () => {
        setshowModal(true)
    }

    const handleFileDownload = (file) => {
        let url = '${process.env.REACT_APP_PROJECT}/request/get_file'
        let method = 'POST'
        let headers = {
            'Content-Type': 'application/json',
        }

        let payload = {
            method: method, 
            url: url,
            responseType: 'blob',
            data:{
                attachments: [file],
            }, 
            headers,
        }
        setIsDownloadingFiles(true)
        axios(payload)
            .then((response) => {
                setIsDownloadingFiles(false)
                const downloadUrl = window.URL.createObjectURL(
                    new Blob([response.data]),
                )
                const link = document.createElement('a')

                link.href = downloadUrl
                //link.setAttribute('download', file.file_name + '_files.zip')
                link.setAttribute('download', 'attachment_files.zip')
                document.body.appendChild(link)
                link.click()
                link.remove()
                notification.success({
                    message: 'File downloaded successfully!',
                })
            })

            .catch((error) => {
                setIsDownloadingFiles(false)
                if(error.response){
                    notification.warning({
                        message: error.response,
                    })
                } else {
                    notification.error({
                        message: 'Ann unexpected error occured',
                    })
                }
            })
    }

    const deleteFile = useMutation({
        mutatationKey: 'deleteFile',
        mutationFn: (file) => {
            const url = process.env.REACT_APP_PROJECT + '/request/delete_file'
            return axios.post(url, file)
        }, 
        onError: (error) => {
            console.error('Error while deleting file:', error)
            notification.error({message: error.message})
        }, 
        onSuccess: (file) => {
            notification.success({
                message: 'File '${file.file_name}' has been deleted successfully!' ,
            })
        }
    })

    const handleFileDelete = (file) => {
        deleteFile.mutate(file)
        const updatedFiles = files.filter((f) => f !== file)
        setFiles(updatedFiles)
        saveFilesToStorage(updatedFiles)
        reload()
    }

    const props = {
        name: 'file',
        listType: 'picture', 
        multiple: true, 
        beforeUpload: handleBeforeUpload, 
        showUploadList: false, 

        data: {
            id: requestId,
        }

        onChange(info){

            const { status } = info.file
            if(status !=='uploading'){
                console.log(info.file, info.fileList)
            }
            if (status === 'done'){
                message.success('${info.file.name} file uploaded successfully!')
            } else if ( status === 'error'){
                message.error('${info.file.name} file upload failed.')
            }
        },

        onDrop(e){
            console.log('Dropped files', e.dataTransfer.files)
        }
    }

    return(
        <>

            <Tooltip title="Click to upload attachments" mouseLeaveDelay={0}>
                <Button
                 onClick={openCustomModal}
                 size="small"
                 shape="circle"
                 icon={<UploadedOutlined/>}
                />
            </Tooltip>
            
            <Modal
                title = "Upload Files"
                open = {showModal}
                // onCancel = {handleModalCancel}
                onCancel={()=> {
                   setFiles([])
                   setShowModal(false)
                }}
                onOk={handleModalOk}
                footer = {null}
                fileList = {uploadedFiles}
                width = "auto"
            >

                <Tabs defaultActiveKey="1">
                <TabPane tab="Upload" key="1">
                    <Dragger {...props}>
                        <p className="ant-upload-drag-icon"> 
                            <InboxOutlined/>
                        </p>
                        <p className="ant-upload-text">
                            <a id="upload_link">Upload</a> or drag file to this area to upload
                        </p>
                        <p className="ant-upload-hint">
                        .pdf, .docs, .txt, .xlsx file, up to 50 MB file size. 
                        </p>
                    </Dragger>

                    <div className="assign">
                        <div className="label">
                            <Text>Assign</Text>
                        </div>

                        <select
                            mode="multiple"
                            value={selectedOption}
                            onChange={handleSelectChange}
                            placeholder = {'Select parts'}
                            rowKey="base_id"
                            dataSource={askOffers}
                            rowSelection={rowSelection}
                            
                        >

                            {askOffers.map((offer) => (
                                <Option key={offer.base_id} value={offer.base_id}>
                                    {offer.part_id_client}
                                </Option>
                            ))}
                        </select>
                    </div>

                    <List className="new_attachment"
                    dataSource={record.attachments}
                    renderItem={(record) => (
                        <List.Item
                            key={record.sum}
                            actions={[
                                <Tooltip title="Download" mouseLeaveDelay={0}>
                                    <a onClick={() => handleFileDownload(record)} key="download">
                                        <DownloadOutlined className="link"/>
                                    </a>
                                </Tooltip>,
                                <Tooltip title="Delete" mouseLeaveDelay={0}>
                                <a onClick={() => handleFileDelete(record)} key="delete">
                                    <DownloadOutlined className="link"/>
                                </a>
                                </Tooltip>,
                            ]}
                        >
                            <List.Item.Meta
                                /*<List.Item.Meta>avatar={getFileIcon(record.file_name, record.mime_type)}*/
                                title = {record.file_name}
                                description = {'Size: ${(record.size / 1000000).toFixed(2)} mb'}
                            />
                        </List.Item>
                    )}
                    />

                    <div className="upload_buttons">
                        <Button className="btn_cancel" onClick={handleModalCancel}>Cancel</Button>
                        <Button className="btn_save" type="primary" onClick={handleModalOk}>Save</Button>
                    </div>

                </TabPane>

                <TabPane tab="Attachments" key="2">
                    <div class="wrap_list">
                    <p id="attachment_text"> Attachments </p>
                    
                    <List className="attachment_tablist"
                    dataSource={record.attachments}
                    renderItem={(record) => (
                        <List.Item
                            key={record.sum}
                            actions={[
                                <Tooltip title="Download" mouseLeaveDelay={0}>
                                    <a onClick={() => handleFileDownload(record)} key="download">
                                        <DownloadOutlined className="link"/>
                                    </a>
                                </Tooltip>,
                                <Tooltip title="Delete" mouseLeaveDelay={0}>
                                <a onClick={() => handleFileDelete(record)} key="delete">
                                    <DownloadOutlined className="link"/>
                                </a>
                                </Tooltip>,
                            ]}
                        >
                            <List.Item.Meta
                                /*<List.Item.Meta>avatar={getFileIcon(record.file_name, record.mime_type)}*/
                                title = {record.file_name}
                                description = {'Size: ${(record.size / 1000000).toFixed(2)} mb'}
                            />
                        </List.Item>
                    )}
                    />
                    </div>
                </TabPane>
            </Tabs>
            </Modal>

        </>
    )
}

export default AddAttachment