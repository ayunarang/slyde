import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'
import './Login.css'
import { Button, Container, Paper, TextField, Typography} from '@mui/material'
import { setUser } from '../../redux/reducers/User';
import { useDispatch, useSelector } from 'react-redux';


const Login = () => {
    const navigate = useNavigate();
    const dispatch= useDispatch()

    const [isLogin, setisLogin] = useState(true);


    const submitSignupData = async () => {
        try {
            console.log(formData)
            const response = await axios.post(`http://localhost:4000/api/signup-user`,
                formData);

            console.log(response);
            const userId = response.data.user._id;
            const username=response.data.user.username;
            const email=response.data.user.email;
            console.log(userId);
            localStorage.setItem('userId', userId);
            console.log('signup successful');
            dispatch(setUser(userId, username, email));

            navigate('/rooms')
        } catch (error) {
            console.log("signup failed", { ...error })
            console.log({ error: error.message });
        }
    };

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };



    const submitLoginData = async () => {


        try {
            const response = await axios.post(`http://localhost:4000/api/login-user`,
                {username: formData.username, password:formData.password});

            console.log(response);
            const userId = response.data.userId;
            console.log(userId);
            localStorage.setItem('userId', userId);
            console.log('Login successful');

            navigate('/rooms')

        } catch (error) {
            console.log("Login failed")
            console.log({ error: error.message });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(formData);
        if (isLogin) submitLoginData();
        else submitSignupData();
    };

    return (

        <>

            <Container component={'main'} maxWidth="xs" sx={{ justifyContent: "center", alignItems: "center", display: "flex", height: "100vh" }}>
                <Paper
                    elevation={3}
                    sx={
                        {
                            padding: 4,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center"
                        }
                    }
                >
                    {(isLogin) ? <>
                        <Typography variant='h5' sx={{ marginBottom: "0.5rem", fontWeight: "600" }}>
                            Login
                        </Typography>
                        <form>
                            <TextField
                                required
                                fullWidth
                                label="Username"
                                variant='outlined'
                                margin='normal'
                                alignItems="center"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}

                                inputProps={{
                                    style: {
                                        backgroundColor: "#FAFAFA"
                                    }
                                }}
                            />

                            <TextField
                                required
                                fullWidth
                                label="password"
                                type='password'
                                variant='outlined'
                                margin='normal'
                                name="password"
                                value={formData.password}
                                onChange={handleChange}

                                inputProps={{
                                    style: {
                                        backgroundColor: "#FAFAFA"
                                    }
                                }} />

                        </form>
                        <Button type='submit' color='primary' variant="contained" sx={{ marginTop: '1rem' }}
                            onClick={handleSubmit}>
                            Login</Button>
                        <Button variant="text" sx={{ marginTop: '1rem', textTransform: 'none' }}
                            onClick={() => setisLogin((prev)=>!prev)}
                        >Signup instead</Button>

                    </> : <>
                        <Typography variant='h5' sx={{ marginBottom: "0.5rem", fontWeight: "600" }}>
                            Signup
                        </Typography>
                       
                        <form>
                            <TextField
                                required
                                fullWidth
                                label="Username"
                                variant='outlined'
                                margin='normal'
                                name="username"
                                value={formData.username}
                                onChange={handleChange}

                                inputProps={{
                                    style: {
                                        backgroundColor: "#FAFAFA"
                                    }
                                }} />

                            <TextField
                                required
                                fullWidth
                                label="email"
                                type='email'
                                variant='outlined'
                                margin='normal'
                                name="email"
                                value={formData.email}
                                onChange={handleChange}

                                inputProps={{
                                    style: {
                                        backgroundColor: "#FAFAFA"
                                    }
                                }} />
                            <TextField
                                required
                                fullWidth
                                label="password"
                                type='password'
                                variant='outlined'
                                margin='normal'
                                name="password"
                                value={formData.password}
                                onChange={handleChange}

                                inputProps={{
                                    style: {
                                        backgroundColor: "#FAFAFA"
                                    }
                                }} />
                            <TextField
                                required
                                fullWidth
                                label="Confirm password"
                                type='password'
                                variant='outlined'
                                margin='normal'
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}

                                inputProps={{
                                    style: {
                                        backgroundColor: "#FAFAFA"
                                    }
                                }} />

                        </form>
                        <Button
                            type='submit'
                            color='primary'
                            variant="contained"
                            sx={{ marginTop: '1rem', textTransform: 'none' }}
                            onClick={handleSubmit}>
                            SIGN UP</Button>
                        <Button variant="text" sx={{ marginTop: '1rem', textTransform: 'none' }}
                            onClick={() => setisLogin((prev)=>!prev)}
                        >Already a user? Login here</Button>




                    </>}
                </Paper>
            </Container>

            {/* <div class="signup-container">
            <div className="signup-form-container">
                <form class="signup-form" onSubmit={handleSubmit}>
                    <input class="signup-form-input"
                        placeholder="Enter Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                    ></input>
                    <input class="signup-form-input"
                        placeholder="Enter password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                    ></input>

                    <button type="submit" className="submit-signup-button">Login here</button>
                    <p className='not-a-user' onClick={()=>{navigate('/signup')}}>Not a user? Signup instead</p>

                </form>
            </div>

        </div> */}

        </>
    )
}

export default Login
