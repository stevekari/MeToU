package com.stevechat.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaFallbackController {

    @GetMapping({
            "/",
            "/login",
            "/register",
            "/friends",
            "/settings",
            "/calls",
            "/calls/**",
            "/chat/**"
    })
    public String forwardSpa() {
        return "forward:/index.html";
    }
}
