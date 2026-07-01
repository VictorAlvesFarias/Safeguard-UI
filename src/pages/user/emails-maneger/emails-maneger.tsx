import React, { useEffect, useState } from 'react';
import Content from "../../../components/content";
import { useQuery } from "../../../utils/hooks/query-hooks";
import Loading from "../../helpers/loading/loading";
import InputText from '../../../components/input-text';
import Form from '../../../components/form';
import Button from '../../../components/button';
import InputRoot from '../../../components/input-root';
import Label from '../../../components/label';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { emailService } from '../../../services/emails-service';
import { If } from 'react-base-components';
import { SelectContext } from 'react-base-components';
import DropdownRoot from '../../../components/dropdown-root';
import DropdownMenu from '../../../components/dropdown-menu';
import DropdownOption from '../../../components/dropdown-option';
import { EmailAddressEntity } from '../../../interfaces/entities/email-address-entity';
import { base64ToImage } from '../../../utils/extensions/image';
import { MASK } from '../../../config/mask-confg';
import moment from 'moment';
import { dateFormat } from '../../../utils/extensions/date';
import { ChevronLeft } from 'lucide-react';
import { PlatformEntity } from '../../../interfaces/entities/platform-entity';
import { EmailEntity } from '../../../interfaces/entities/email-entity';
import { platformService } from '../../../services/platforms-service';
import { emailAddressService } from '../../../services/email-address-service';
import { AccordionContainer } from 'react-base-components';
import AccordionRoot from '../../../components/accordion-root';
import AccordionTitle from '../../../components/accordion-title';
import { AccordionContext } from 'react-base-components';
import { USER_ROUTES } from '../../../config/routes-config';
import { useAppDispatch, useAppSelector } from '../../../utils/hooks/redux-hooks';
import { setPipelineData } from '../../../slices/pipeline-slice';
import Accordion from '../../../components/accordion';
import Span from '../../../components/span';

function EmailsManeger() {
    const [finished, setQuery, setFinished] = useQuery(false);
    const [currentImage, setCurrentImage] = useState<string | null>();
    const [currentImageSecundary, setCurrentImageSecundary] = useState<string>("")
    const [isEditable, setIsEditable] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [platforms, setPlatforms] = useState<PlatformEntity[]>([]);
    const [emailAddresses, setEmailAddresses] = useState<EmailAddressEntity[]>([]);
    const back: any = -1;
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const pipeline = useAppSelector(state => state.pipeline.value);
    const [searchParams] = useSearchParams();

    const urlParams = {
        id: searchParams.get("id")
    };

    const schema = z.object({
        name: z.string().min(1, 'Name is required'),
        lastName: z.string().optional(),
        birthDate: z.string().refine(value => moment(value, "DD/MM/YYYY").isValid(), {
            message: "Invalid date format (DD/MM/YYYY)"
        }),
        username: z.string().min(1, 'Username is required'),
        phone: z.string().min(1, 'Phone is required'),
        password: z.string().min(1, 'Password is required'),
        emailAddressId: z.number().min(1, 'Email address is required'),
        platformId: z.number().min(1, 'Platform is required'),
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        control,
        watch,
        setValue,
    } = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
    });

    function handleAddEmail(data: z.infer<typeof schema>) {
        return emailService.add({
            ...data,
            birthDate: new Date(dateFormat(data.birthDate))
        }).then(r => {
            if (pipeline.isActive) {
                dispatch(setPipelineData({ emailId: r.data?.id || r.data }))
                navigate(USER_ROUTES.PIPELINE)
            } else {
                navigate(back)
            }
        });
    }

    function handleUpdateEmail(data: z.infer<typeof schema>) {
        return emailService.update({
            ...data,
            birthDate: new Date(dateFormat(data.birthDate))
        }, Number(urlParams.id)).then(() => {
            setIsEditing(false);
        });
    }

    function handleAddOrUpdate(data: z.infer<typeof schema>) {
        if (isEditable) {
            setQuery(() => handleUpdateEmail(data));
        } else {
            setQuery(() => handleAddEmail(data));
        }
    }

    function handleGetEmail() {
        if (!urlParams.id) return Promise.resolve();

        return emailService.getById({ id: urlParams.id })
            .then(({ res }) => {
                reset({
                    ...res,
                    birthDate: moment(res.birthDate).format("DD/MM/YYYY"),
                    emailAddressId: res.emailAddress.id
                });
                setIsEditable(true);
                setCurrentImage(base64ToImage(
                    res.emailAddress.provider.image.storedFile.base64,
                    res.emailAddress.provider.image.storedFile.mimeType
                ));
            });
    }

    function handleGetPlatforms() {
        return platformService.getAll().then(({ res }) => {
            setPlatforms(res);
        });
    }

    function handleGetEmailAddresses() {
        return emailAddressService.getAll().then(({ res }) => {
            setEmailAddresses(res);
        });
    }
    function getEmailAddress() {
        return emailAddresses.find(e => e.id === watch("emailAddressId"));
    }

    function getPlatform() {
        return platforms.find(e => e.id === watch("platformId"));
    }

    useEffect(() => {
        if (urlParams.id) {
            setQuery([
                () => handleGetEmail(),
                () => handleGetPlatforms(),
                () => handleGetEmailAddresses(),
            ]);
        }
        else {
            if (pipeline.isActive && pipeline.platformId) {
                setValue('platformId', pipeline.platformId)
            }

            if (pipeline.isActive && pipeline.emailAddressId) {
                setValue('emailAddressId', pipeline.emailAddressId)
            }

            if (pipeline.isActive && pipeline.email) {
                setValue('username', pipeline.email)
            }

            if (pipeline.isActive && pipeline.password) {
                setValue('password', pipeline.password)
            }


            if (pipeline.isActive && pipeline.phone) {
                setValue('phone', pipeline.phone)
            }


            if (pipeline.isActive && pipeline.firstName) {
                setValue('name', pipeline.firstName)
            }

            if (pipeline.isActive && pipeline.lastName) {
                setValue('lastName', pipeline.lastName)
            }

            setFinished(true);
            setIsEditing(true);

            setQuery([
                () => handleGetPlatforms(),
                () => handleGetEmailAddresses(),
            ]);
        }
    }, [pipeline.isActive, pipeline.platformId, pipeline.emailAddressId, pipeline.email, pipeline.password, pipeline.phone, pipeline.firstName, pipeline.lastName]);


    useEffect(() => {
        const platformImage = platforms.find(e => e.id == watch("platformId"))?.image

        setCurrentImage(base64ToImage(platformImage?.storedFile.base64, platformImage?.storedFile.mimeType))
    }, [watch("platformId")])

    useEffect(() => {
        const emailAddress = emailAddresses.find(e => e.id === watch("emailAddressId"));

        if (emailAddress) {
            const providerImage = emailAddress.provider?.image;

            if (providerImage) {
                setCurrentImageSecundary(base64ToImage(providerImage.storedFile.base64, providerImage.storedFile.mimeType));
            }
        }
    }, [watch("emailAddressId")]);

    return (
        <Content>
            <div className='bg-fort w-full h-full overflow-auto relative transition-all bg-gradient-to-t from-main-black-800 to-transparent duration-500 bg-main-violet-900'>
                <div className='flex w-full gap-3 items-center p-6'>
                    <Link
                        className='cursor-pointer bg-white bg-opacity-5 hover:bg-opacity-15 w-10 h-10 flex items-center justify-center border-2 border-zinc-400 rounded-full top-0 left-0'
                        to={pipeline.isActive ? USER_ROUTES.PIPELINE : back}
                    >
                        <ChevronLeft />
                    </Link>
                    <h1 className='font-bold text-white text-3xl font-sans'>
                        {urlParams.id ? "E-mail" : "New E-mail"}
                    </h1>
                </div>
                <Loading loading={!finished} />
                <If conditional={finished}>
                    <div className='flex gap-6 w-full my-28 rounded items-center justify-center flex-col p-3 center'>
                        <div className='w-48 h-48 bg-tertiary rounded center relative'>
                            {<img className='w-16 min-h-16 ' src={currentImage ?? currentImageSecundary}></img>}
                            {currentImageSecundary && <img className='w-9 min-h-9 absolute bottom-0 right-0 m-1' src={currentImageSecundary}></img>}
                        </div>
                        <div className='flex gap-3 w-full max-w-3xl'>
                            <Link
                                className='w-full'
                                to={`${USER_ROUTES.RECOVERY_KEYS}?id=${urlParams.id}`}
                                state={{
                                    currentImage,
                                    email: `${getEmailAddress()?.username}@${getEmailAddress()?.provider.signature}`,
                                    platform: getPlatform()?.name
                                }}
                            >
                                <Button variation='outline' className='w-full'>
                                    Keys
                                </Button>
                            </Link>
                            <Link
                                className='w-full'
                                to={`${USER_ROUTES.RECOVERY_EMAILS}?id=${urlParams.id}`}
                                state={{
                                    currentImage,
                                    email: `${getEmailAddress()?.username}@${getEmailAddress()?.provider.signature}`,
                                    platform: getPlatform()?.name
                                }}
                            >
                                <Button variation='outline' className='w-full'>
                                    E-mails
                                </Button>
                            </Link>
                            <Link
                                className='w-full'
                                to={`${USER_ROUTES.EMAIL_FILES}?id=${urlParams.id}`}
                                state={{
                                    currentImage,
                                    email: `${getEmailAddress()?.username}@${getEmailAddress()?.provider.signature}`,
                                    platform: getPlatform()?.name
                                }}
                            >
                                <Button variation='outline' className='w-full'>
                                    Files
                                </Button>
                            </Link>
                        </div>
                        <div className='w-full flex-1 rounded center max-w-3xl flex-col'>
                            <Form variation='card' onSubmit={handleSubmit(handleAddOrUpdate)}>
                                <InputRoot>
                                    <Label>Email Address</Label>
                                    <Controller
                                        name='emailAddressId'
                                        control={control}
                                        render={({ field }) => (
                                            <SelectContext onChange={field.onChange}>
                                                <DropdownRoot
                                                    {...field}
                                                    disabled={!isEditing}
                                                    placeholder='Select email address'
                                                >
                                                    <DropdownMenu>
                                                        {emailAddresses.map((e, i) => (
                                                            <DropdownOption
                                                                key={i}
                                                                label={`${e.username}@${e.provider.signature}`}
                                                                value={e.id}
                                                            />
                                                        ))}
                                                    </DropdownMenu>
                                                </DropdownRoot>
                                            </SelectContext>
                                        )}
                                    />
                                    <Span variation='error'>{errors.emailAddressId?.message}</Span>
                                </InputRoot>
                                <InputRoot>
                                    <Label>Platform</Label>
                                    <Controller
                                        name='platformId'
                                        control={control}
                                        render={({ field }) => (
                                            <SelectContext onChange={field.onChange}>
                                                <DropdownRoot
                                                    {...field}
                                                    disabled={!isEditing}
                                                    placeholder='Select platform'
                                                >
                                                    <DropdownMenu>
                                                        {platforms.map((e, i) => (
                                                            <DropdownOption
                                                                key={i}
                                                                label={e.name}
                                                                value={e.id}
                                                            />
                                                        ))}
                                                    </DropdownMenu>
                                                </DropdownRoot>
                                            </SelectContext>
                                        )}
                                    />
                                    <Span variation='error'>{errors.platformId?.message}</Span>
                                </InputRoot>
                                <InputRoot>
                                    <Label>Name</Label>
                                    <InputText
                                        placeholder='First name'
                                        {...register('name', { disabled: !isEditing })}
                                    />
                                    <Span variation='error'>{errors.name?.message}</Span>
                                </InputRoot>
                                <InputRoot>
                                    <Label>Last Name</Label>
                                    <InputText
                                        placeholder='Last name'
                                        {...register('lastName', { disabled: !isEditing })}
                                    />
                                    <Span variation='error'>{errors.lastName?.message}</Span>
                                </InputRoot>
                                <InputRoot>
                                    <Label>Birth Date</Label>
                                    <InputText
                                        mask={MASK.DATE}
                                        placeholder='DD/MM/YYYY'
                                        {...register('birthDate', { disabled: !isEditing })}
                                    />
                                    <Span variation='error'>{errors.birthDate?.message}</Span>
                                </InputRoot>
                                <InputRoot>
                                    <Label>Username</Label>
                                    <InputText
                                        placeholder='Username'
                                        {...register('username', { disabled: !isEditing })}
                                    />
                                    <Span variation='error'>{errors.username?.message}</Span>
                                </InputRoot>
                                <InputRoot>
                                    <Label>Phone</Label>
                                    <InputText
                                        placeholder='Phone number'
                                        {...register('phone', { disabled: !isEditing })}
                                    />
                                    <Span variation='error'>{errors.phone?.message}</Span>
                                </InputRoot>
                                <InputRoot>
                                    <Label>Password</Label>
                                    <InputText
                                        placeholder='Password'
                                        type='password'
                                        {...register('password', { disabled: !isEditing })}
                                    />
                                    <Span variation='error'>{errors.password?.message}</Span>
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
            </div >
        </Content >
    );
}

export default EmailsManeger;