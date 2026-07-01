import { zodResolver } from '@hookform/resolvers/zod';
import { toFormData } from 'axios';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { If } from 'react-base-components';
import { ModalContext } from 'react-base-components';
import { ModalOpen } from 'react-base-components';
import { ModalRootContainer } from 'react-base-components';
import Button from '../../../components/button';
import Content from "../../../components/content";
import Form from '../../../components/form';
import InputRoot from '../../../components/input-root';
import InputText from '../../../components/input-text';
import Label from '../../../components/label';
import Span from '../../../components/span';
import FilesManagerDialog from '../../../dialogs/files-manager-dialog/files-manager-dialog';
import { FileEntity } from '../../../interfaces/entities/file-entity';
import { platformService } from '../../../services/platforms-service';
import { base64ToImage } from '../../../utils/extensions/image';
import { useQuery } from "../../../utils/hooks/query-hooks";
import Loading from "../../helpers/loading/loading";
import { ChevronLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../utils/hooks/redux-hooks';
import { setPipelineData } from '../../../slices/pipeline-slice';
import { USER_ROUTES } from '../../../config/routes-config';

function PlatformsManeger() {
    const [finished, setQuery, setFinished] = useQuery(false)
    const [currentImage, setCurrentImage] = useState<null | string>(null)
    const [isEditable, setIsEditable] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const back: any = -1
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const pipeline = useAppSelector(state => state.pipeline.value)
    const [searchParams, setSearchParams] = useSearchParams()

    const urlParams = {
        id: searchParams.get("id")
    }
    const schema = z.object({
        name: z.string().nonempty('Required'),
        imageId: z.string().nonempty('Required'),
    })
    const { register, handleSubmit, formState: { errors }, setValue, reset, control } = useForm<z.infer<typeof schema>>(
        {
            resolver: zodResolver(schema),
        }
    )

    function handleSelectImage(file: FileEntity) {
        setValue('imageId', String(file.id), { shouldValidate: true })
        setCurrentImage(base64ToImage(file.storedFile.base64, file.storedFile.mimeType))
    }
    function handleAddPlatform(data: any) {
        return platformService.add(toFormData(data))
            .then(r => {
                if (pipeline.isActive) {
                    dispatch(setPipelineData({ platformId: r.data?.id || r.data }))
                    navigate(USER_ROUTES.PIPELINE)
                } else {
                    navigate(back)
                }
            })
    }
    function handleUpdatePlatform(data: any) {
        return platformService.update(toFormData(data), urlParams.id)
            .then(() => {
                setIsEditing(false)
            })
    }
    function handleAddOrUpdate(data: any) {
        if (isEditable) {
            setQuery(() => handleUpdatePlatform(data))
        }
        else {
            setQuery(() => handleAddPlatform(data))
        }
    }
    function handleGetPlatform() {
        return platformService.getById({ id: urlParams.id })
            .then(({ res }: any) => {
                reset(res)
                setIsEditable(true)
                setCurrentImage(base64ToImage(res.image.storedFile.base64, res.image.storedFile.mimeType))
            })
    }

    useEffect(() => {
        if (urlParams.id != null) {
            setQuery(() => handleGetPlatform())
        }
        else {
            if (pipeline.isActive && pipeline.platform) {
                setValue('name', pipeline.platform)
            }
            setFinished(true)
            setIsEditing(true)
        }
    }, [pipeline.isActive, pipeline.platform])

    return (
        <Content >
            <div className='bg-fort w-full h-full overflow-auto relative transition-all bg-gradient-to-t from-main-black-800 to-transparent duration-500   bg-main-violet-900'>
                <div className='flex w-full gap-3 items-center p-6'>
                    <Link className='cursor-pointer  bg-white bg-opacity-5 hover:bg-opacity-15 w-10 h-10 flex items-center justify-center border-2 border-zinc-400 rounded-full top-0 left-0 ' to={pipeline.isActive ? USER_ROUTES.PIPELINE : back}>
                        <ChevronLeft />
                    </Link>
                    <h1 className='font-bold font- text-white text-3xl font-sans '>{urlParams.id ? "Platform" : "New Platform"}</h1>
                </div>
                <Loading loading={!finished} />
                <If conditional={finished}>
                    <div className='flex gap-6 w-full  my-28 rounded items-center justify-center  flex-col p-3  center '>
                        <div className='w-48 h-48 bg-tertiary rounded center'>
                            {currentImage && <img className='w-16' src={currentImage}></img>}
                        </div>
                        <If conditional={isEditing || isEditable == false}>
                            <ModalContext>
                                <ModalRootContainer>
                                    <FilesManagerDialog callback={handleSelectImage} />
                                </ModalRootContainer>
                                <ModalOpen className='cursor-pointer mt-3 bg-white bg-opacity-5 border-2 border-zinc-400 p-1.5 px-3 rounded-full'>
                                    Select
                                </ModalOpen>
                            </ModalContext>
                        </If>
                        <div className=' w-full flex-1 rounded center max-w-3xl flex-col'>
                            <Form variation='card' onSubmit={handleSubmit((e) => handleAddOrUpdate(e))} >
                                <InputRoot>
                                    <Label >Name</Label>
                                    <InputText placeholder='name' {...register('name', { disabled: !isEditing })} />
                                    <Span variation='error'>{errors.name?.message}</Span>
                                </InputRoot>
                                <div className='flex w-full center mt-3'>
                                    {isEditing &&
                                        <Button> Save</Button>
                                    }
                                    {!isEditable &&
                                        <Button>Add</Button>
                                    }
                                    {!isEditing && isEditable &&
                                        <Button onClick={() => setIsEditing(true)}>Edit</Button>
                                    }
                                </div>
                            </Form>
                        </div>
                    </div>
                </If>
            </div>
        </Content>
    )
}

export default PlatformsManeger