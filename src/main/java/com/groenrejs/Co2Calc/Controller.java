package com.groenrejs.Co2Calc;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.List;

@org.springframework.stereotype.Controller
public class Controller {

    @GetMapping("")
    public String index(){
        return "calculator";
    }

    @GetMapping("calculator")
    public String test(){
        return "calculator";
    }

}
