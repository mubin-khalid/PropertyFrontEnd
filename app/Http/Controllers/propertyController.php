<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Input;
use \Validator;
use \Cache;
use \Response;
use \RequestException;
use App\Helpers\Helper;
use GuzzleHttp\Client as Guzzle;
use GuzzleHttp\Exception\RequestException as guzzleException;
use \Storage;

class propertyController extends Controller {
    protected $request;
    protected $guzzle;
    protected $apiUrl;
    protected $helper;

    public function __construct(Request $request,  Helper $helper, Guzzle $guzzle) {
        //$this->guzzle->setDefaultOption(env('API_URL'));
        // $this->guzzle->setConfig('defaults/verify', true);
        $this->request = $request;
        $this->apiUrl = env('API_URL');
        $this->helper = $helper;
        $this->guzzle = $guzzle;
    }

    public function postProperty() {
        $data = $this->request->all();
        $validator = Validator::make($data,[
            'location' => 'required',
            'property' => 'required',
            'feature' => 'required',
            'seller' => 'required',
        ]);

        if ($validator->fails()) {
            return Response::json(['success'=>false, 'msg'=>'Property Details are Invalid' ]);
        }
        $data['seller'] = session('user_id');
        $resp  = $this->guzzle->request('POST', $this->apiUrl.'property', ['form_params' => $data]);
        $result = json_decode($resp->getBody());
        if($resp->getStatusCode() == 200 && $result->success == true){
            return Response::json(['success'=>true, 'msg'=>'Property Added Successfully']);
        } else {
            return Response::json(['success'=>false, 'msg'=>'Internal Server Error']);
        }
    }

    public function searchProperty() {
        $data = $this->request->all();
        $queryString = "?purpose=".$data['purpose']."&bedroom=".$data['bedroom']."&bathroom=".$data['bathroom']."&latitude=".$data['latitude']."&longitude=".$data['longitude'];

        $resp = false;
        try {
            $resp  = $this->guzzle->request('GET', $this->apiUrl.'property/livesearch'.$queryString);
            $result = json_decode($resp->getBody());
        } catch (guzzleException $e) {
            if ($e->hasResponse()) {
                $result =  $e->getResponse();
            }
        }
        if($resp && $resp->getStatusCode() == 200 && $result->success == true){
            return Response::json(['success'=>true, 'data'=> $result->data]);
        } else {
            return Response::json(['success'=>false, 'msg'=>'Not Found']);
        }
    }

    public function allProperty() {
        $data = $this->request->all();
        $resp = false;
        try {
            $resp  = $this->guzzle->request('GET', $this->apiUrl.'property');
            $result = json_decode($resp->getBody());
            //echo $resp->getBody();
        } catch (guzzleException $e) {
            // var_dump($e);
            if ($e->hasResponse()) {
                $result =  $e->getResponse();
            }
        }
        if($resp && $resp->getStatusCode() == 200 && $result->success == true){
            return Response::json(['success'=>true, 'data'=> $result->data]);
        } else {
            return Response::json(['success'=>false, 'msg'=>'Not Found']);
        }
    }

    public function userProperty() {
        $resp = false;
        try {
            $resp  = $this->guzzle->request('GET', $this->apiUrl.'property/SearchWithUser?user_id='.session('user_id') );
            $result = json_decode($resp->getBody());
            //echo $resp->getBody();
        } catch (guzzleException $e) {
            echo $e;
            if ($e->hasResponse()) {
                $result =  $e->getResponse();
            }
        }
        if($resp && $resp->getStatusCode() == 200 && $result->success == true){
            return Response::json(['success'=>true, 'msg'=> $result->data]);
        } else {
            return Response::json(['success'=>false, 'msg'=>'Data Not Found']);
        }
    }

    public function postPropertyPic() {
        if(Input::hasFile('propImages') ) {
            $fileSizeLimit = 60 * 1024 * 1024;
            $f = Input::file('propImages');

            if ( $f->getSize() > $fileSizeLimit ) {
                return Response::json(['success'=>false, 'msg'=>'Maximum allowed size is '.($fileSizeLimit/1024)]);
            }

            if ( !($f->getMimeType() =='image/jpeg' || $f->getMimeType() =='image/jpg'
                || $f->getMimeType() =='image/gif')) {
                return Response::json(['success'=>false, 'msg'=>'Allowed types are jpeg, jpg and gif']);
            }
            $type = explode('/', $f->getMimeType())[1];
            $dr = DIRECTORY_SEPARATOR;
            $path = 'images'.$dr.'propertyImages'.$dr.'User_'.session('user_id').'_'.random_int(1, 9999999).'.'.$type;

            $file = file_get_contents($f->getRealPath());
            $mkfile = file_put_contents(storage_path($path), $file);

            if($mkfile)
                return Response::json(['success'=>true, 'msg'=>'Picture uploaded succcessfully',
                    'image_url'=>$path]);
        }

        return Response::json(['success'=>false, 'error'=>'Picture not found']);
    }

    public function getPropertyPic($id) {
        $dr = DIRECTORY_SEPARATOR;
        $path = 'images'.$dr.'propertyImages'.$dr.$id;
            $file = file_get_contents(storage_path($path));
            return response($file, 200)->header('Content-Type', 'image/jpeg');
    }
}