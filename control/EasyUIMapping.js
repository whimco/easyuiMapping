/*
 * easyui与knockout的映射绑定
 * author:whimco
 */
(function($){	
	
	var easyuiMapping = {
		_uniqueName:0,       //起始值
		caching:{},          //缓存对象	
		plugins:{},          //插件
		//获取缓存的控件的唯一标识	
		getUniqueName:function(){                  
			this._uniqueName++;
	        return '' + this._uniqueName;
		},
		//缓存组件	
		cacheComponent:function(element, control){         
			var cacheKey = 'cmp-' + this.getUniqueName();
	        if (element) {
	            element.setAttribute('data-unique-name', cacheKey);
	            this.caching[cacheKey] = control;
	        }
		},
		//获取缓存的组件  
		getCachedComponent:function(element){         
			return this.caching[element.attributes['data-unique-name'].value];
		},
		//实例化组件
		createComponent : function (element, valueAccessor, allBindings, viewModel, bindingContext,controlType) {    
	    	var component = new ControlBase(element, valueAccessor, allBindings, viewModel, bindingContext,controlType);
	    	
	    	this.cacheComponent(element, component);	
	        return component;       
	    }	
	};  
    
    var ControlBase = function(element, valueAccessor, allBindings, viewModel, bindingContext,controlType){
		this.element = element;
		this.valueAccessor = valueAccessor();
		this.allBindings = allBindings;
		this.viewModel = viewModel;
		this.bindingContext = bindingContext;
		this.controlType = controlType;
		
		this.options = {};
		
		this.getOptions = function(){
            this.options = $(this.element).attr("data-options");
            if( this.options == undefined){
            	this.options = {};
            	return;
            }
            
            this.options  = eval("[{" + this.options + "}]")[0];
        };
        
        //扩展options和allBindings
        this.extendOptions = function(){
        	var self = this;
            var allBindings = this.allBindings();
            for(property in allBindings){
                //如果data-bind中的属性在$.fn.xxx.defaults中存在，则视为有效的属性。
                if($.fn[this.controlType].defaults.hasOwnProperty(property)){
                    //如果属性是ko的可观察对象，则取出其值，赋给options
                    if( ko.isObservable(allBindings[property])){
                        this.options[property] = allBindings[property]();
                        
                        //如果是基本类型，则直接赋值
                    }else if( typeof( allBindings[property]) == "string"
                           || typeof( allBindings[property]) == "boolean"
                           || typeof( allBindings[property]) == "number"
                           || typeof( allBindings[property]) == "object"
                           || typeof( allBindings[property]) == "array"){
                       this.options[property] = allBindings[property];
                       
                       //如果是方法，则使用闭包切换this对象，并赋值
                    }else if( typeof(allBindings[property]) == "function"){
                            var fun = (function(property){
                                return  function()
                                {                                          
                                    allBindings[property].call(self.viewModel);
                                };
                            })(property);
                           
                           this.options[property] = fun;
                    }
                }
            }
        };
        
        this.activeObservable = function(){
        	var self = this;
            var allBindings = this.allBindings();
            for(property in allBindings){
                //如果data-bind中的属性在$.fn.xxx.defaults中存在，则视为有效的属性。
                if($.fn[this.controlType].defaults[property] != undefined){
                    //如果属性是ko的可观察对象，则取出其值，赋给options
                    if( ko.isObservable(allBindings[property])){
                        this.options[property] = allBindings[property]();
                    }
                }
            }
        };
        
        //绑定通用默认事件
        this.bindDefaultEvents = function() {
        	var self = this;
        	if(this.options["onChange"]){
        		var fun = this.options["onChange"];
        		this.options["onChange"] = function(newValue){
        			self.valueAccessor(newValue);
        			fun();
        		};
        	}else{
        		this.options["onChange"] = function(newValue){
        			self.valueAccessor(newValue);
        		};
        	}
        };
        
        //绑定用户扩展的事件
        this.bindPluginInit = function() {
        	if(easyuiMapping.plugins[this.controlType] != undefined){
        		easyuiMapping.plugins[this.controlType].init.call(this);
        	}
        };
        
         //绑定用户更新的事件
        this.bindPluginUpdate = function(){
        	if(easyuiMapping.plugins[this.controlType] != undefined){
        		easyuiMapping.plugins[this.controlType].update.call(this);
        	}
        };
		
		this.init = function(){			
			this.getOptions();
			this.extendOptions();
			this.bindDefaultEvents();
			this.bindPluginInit();
			
			$(element)[this.controlType](this.options);
		};
		
		this.update = function(){
			//更新可观察对象的值
			this.activeObservable();
			
			//刷新控件
			this.getOptions();
			this.extendOptions();
			this.bindDefaultEvents();
			//处理绑定的扩展操作
			this.bindPluginUpdate();
			
			$(element)[this.controlType](this.options);
		};
	};
	
	window.easyuiMapping = window.easyuiMapping || easyuiMapping;
	
    //迭代生成绑定器
    for(control in $.fn){
		//$.fn中带defauls属性的插件，即为easyui的插件
		if($.fn[control].defaults == undefined){
			continue;
		}
		
		//动态生成ko的插件名称与easyui的插件名称保持一致
		 ko.bindingHandlers[control] = (function(controlType){
		 	return {
		 		init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
		 			easyuiMapping.createComponent(element, valueAccessor, allBindings, viewModel, bindingContext,controlType).init();
		 		},update:function(element, valueAccessor, allBindings, viewModel, bindingContext) {
		 			easyuiMapping.getCachedComponent(element).update();
		 		}
		 	};
		 })(control);
	}       
})(jQuery);