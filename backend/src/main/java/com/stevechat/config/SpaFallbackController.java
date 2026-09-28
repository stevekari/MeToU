package com.stevechat.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaFallbackController {

    @GetMapping({
            "/",
            "/feed",
            "/login",
            "/register",
            "/friends",
            "/settings",
            "/calls",
            "/calls/**",
            "/network",
            "/network/**",
            "/profile",
            "/profile/**",
            "/chat/**"
    })
    public String forwardSpa() {
        return "forward:/index.html";
    }
}
