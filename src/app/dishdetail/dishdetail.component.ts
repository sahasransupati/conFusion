import { Component, OnInit, Input, ViewChild, Inject } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { Dish } from '../shared/dish';
import { Comment } from '../shared/comment';

import { DishService } from '../services/dish.service';

import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],

  animations: [
    trigger('visibility', [
        state('shown', style({
            transform: 'scale(1.0)',
            opacity: 1
        })),
        state('hidden', style({
            transform: 'scale(0.5)',
            opacity: 0
        })),
        transition('* => *', animate('0.5s ease-in-out'))
    ])
  ]

})
export class DishdetailComponent implements OnInit {

    @ViewChild('fform') commentFormDirective;

    dish: Dish;
    dishIds: string[];
    prev: string;
    next: string;
    errMess : string;
    dishcopy: Dish;  

    visibility = 'shown';

    commentForm: FormGroup;
    comment: Comment;

  
    formErrors = {
      'author': '',
      'comment': ''
    };
    
    validationMessages = {
      'author': {
        'required':      'Author Name is required.',
        'minlength':     'First Name must be at least 2 characters long.'
      },
      'comment': {
        'required':      'Comment is required.',
        'minlength':     'Comment must be at least 1 character long.'
      }
    };

    constructor(private dishservice: DishService,
      private route: ActivatedRoute,
      private location: Location,
      private fb: FormBuilder,
      @Inject('baseURL') private baseURL) {
        this.createForm();
     }
  
    ngOnInit() {
      this.dishservice.getDishIds()
      .subscribe(dishIds => this.dishIds = dishIds, errmess => this.errMess = <any>errmess);
      this.route.params
        .pipe(switchMap((params: Params) => { this.visibility = 
          'hidden'; return this.dishservice.getDish(+params['id']); }))
        .subscribe(dish => { this.dish = dish; this.dishcopy = dish; 
          this.setPrevNext(dish.id); this.visibility = 'shown';},
         errmess => this.errMess = <any>errmess);
      
      //const id = String(+this.route.snapshot.params['id']);
      //this.dishservice.getDish(id).subscribe(dish => this.dish = dish);
    }

    setPrevNext(dishId: string) {
      const index = this.dishIds.indexOf(dishId);
      this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
      this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
    }
  
    goBack(): void {
      this.location.back();
    }

    createForm(): void {
      this.commentForm = this.fb.group({
        author: ['', [Validators.required, Validators.minLength(2)] ],
        comment: ['', [Validators.required] ],
        rating: 5
      });
  
      this.commentForm.valueChanges
        .subscribe(data => this.onValueChanged(data));
  
      this.onValueChanged(); // (re)set validation messages now
    }
  
    onValueChanged(data?: any) {
     
      if (!this.commentForm) { return; }
      const form = this.commentForm;
      for (const field in this.formErrors) {
        if (this.formErrors.hasOwnProperty(field)) {
          // clear previous error message (if any)
          this.formErrors[field] = '';
          const control = form.get(field);
          if (control && control.dirty && !control.valid) {
            const messages = this.validationMessages[field];
            for (const key in control.errors) {
              if (control.errors.hasOwnProperty(key)) {
                this.formErrors[field] += messages[key] + ' ';
              }
            }
          }
        }
      }
    }
  
    onSubmit() {
      this.comment = this.commentForm.value;
      this.comment.date = new Date().toISOString();
      this.dish.comments.push(this.comment);
      this.dishservice.putDish(this.dishcopy)
      .subscribe(dish => {
        this.dish = dish; this.dishcopy = dish;
      },
      errmess => { this.dish = null; this.dishcopy = null; this.errMess = <any>errmess; });
      this.comment = null;
      this.commentForm.reset({
      author: '',
      comment: '',
      rating: 5
    });
  }

  }

