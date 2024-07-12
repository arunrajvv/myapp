export interface mapData {
    business_status : string
    geometry : {
        location : {
            lat : any,
            lng : any
        },
        viewport : {
            northeast : {
                lat : any,
                lng : any
            },
            southwest : {
                lat : any,
                lng : any
            }
        }
    },
    icon : string,
    icon_background_color : string,
    icon_mask_base_uri : string,
    name : string,
    opening_hours : {
        open_now : boolean
    },
    photos : [
        {
            height : any,
            html_attributions : any,
            photo_reference : string,
            width : any
        }
    ],
    place_id : string,
    plus_code : {
        compound_code : string,
        global_code : string
    },
    rating : any,
    reference : string,
    scope : string,
    types : any,
    user_ratings_total : any,
    vicinity : string
}